import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkStatus, Nomination, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { CreateWorkDto, UpdateWorkDto } from './dto';

/**
 * Декодирует имя файла из latin1 в UTF-8
 * Multer иногда некорректно обрабатывает UTF-8 имена файлов
 */
function decodeFilename(filename: string): string {
  try {
    // Пробуем декодировать как latin1 -> utf8
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    // Проверяем, что декодирование было успешным (нет искажённых символов)
    if (decoded.includes('�')) {
      return filename; // Возвращаем оригинал если декодирование не удалось
    }
    return decoded;
  } catch {
    return filename;
  }
}

// Допустимые MIME-типы
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

// Максимальный размер файла (15 МБ)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/**
 * Сервис управления конкурсными работами
 */
@Injectable()
export class WorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Подача работы на конкурс
   */
  async create(
    dto: CreateWorkDto,
    file: Express.Multer.File,
    studentId: string,
  ) {
    // Валидация файла
    this.validateFile(file);

    // Проверяем, не подавал ли участник работу в эту номинацию
    const existingWork = await this.prisma.work.findFirst({
      where: {
        studentId,
        nomination: dto.nomination,
      },
    });

    if (existingWork) {
      throw new BadRequestException(
        `Вы уже подали работу в номинации "${this.getNominationLabel(dto.nomination)}"`,
      );
    }

    // Проверяем дедлайн
    const deadlineSetting = await this.prisma.setting.findUnique({
      where: { key: 'submission_deadline' },
    });
    if (deadlineSetting?.value) {
      const deadline = new Date(deadlineSetting.value as string);
      if (new Date() > deadline) {
        throw new BadRequestException('Приём работ завершён');
      }
    }

    // Декодируем имя файла (исправляем кодировку русских имён)
    const decodedFileName = decodeFilename(file.originalname);

    // Загружаем файл в S3
    const { key, size } = await this.storageService.uploadFile(
      file.buffer,
      decodedFileName,
      file.mimetype,
    );

    // Создаём запись о работе
    const work = await this.prisma.work.create({
      data: {
        title: dto.title,
        nomination: dto.nomination,
        workType: dto.workType,
        fileKey: key,
        fileName: decodedFileName,
        fileMime: file.mimetype,
        fileSize: size,
        studentId,
        status: 'moderation', // На модерации после загрузки
      },
      select: {
        id: true,
        title: true,
        nomination: true,
        workType: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
      },
    });

    // Отправляем уведомление о подаче работы
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { email: true, fullName: true },
    });
    if (student) {
      this.mailService.sendWorkSubmittedEmail(
        student.email,
        student.fullName,
        dto.title,
        this.getNominationLabel(dto.nomination),
      ).catch((err) => {
        console.error('[Works] Error sending work submitted email:', err);
      });
    }

    return work;
  }

  /**
   * Получение работ текущего пользователя
   */
  async findMyWorks(studentId: string) {
    return this.prisma.work.findMany({
      where: { studentId },
      select: {
        id: true,
        title: true,
        nomination: true,
        workType: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        rating: {
          select: {
            score: true,
            comment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получение работ, назначенных эксперту
   */
  async findAssignedWorks(expertId: string) {
    return this.prisma.work.findMany({
      where: { expertId },
      select: {
        id: true,
        title: true,
        nomination: true,
        workType: true,
        fileName: true,
        fileSize: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            school: true,
            grade: true,
          },
        },
        rating: {
          select: {
            id: true,
            score: true,
            comment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получение работы по ID
   */
  async findById(id: string, userId: string, userRole: Role) {
    const work = await this.prisma.work.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            school: true,
            grade: true,
          },
        },
        expert: {
          select: {
            id: true,
            fullName: true,
          },
        },
        rating: true,
      },
    });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    // Проверка доступа
    const canAccess =
      userRole === 'admin' ||
      work.studentId === userId ||
      work.expertId === userId;

    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этой работе');
    }

    return work;
  }

  /**
   * Обновление работы (только автор, только если на модерации)
   */
  async update(id: string, dto: UpdateWorkDto, userId: string) {
    const work = await this.prisma.work.findUnique({ where: { id } });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    if (work.studentId !== userId) {
      throw new ForbiddenException('Нет прав на редактирование этой работы');
    }

    if (work.status !== 'moderation') {
      throw new BadRequestException('Редактирование доступно только для работ на модерации');
    }

    return this.prisma.work.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        title: true,
        nomination: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Замена файла работы (только автор, только если на модерации)
   */
  async replaceFile(id: string, file: Express.Multer.File, userId: string) {
    this.validateFile(file);

    const work = await this.prisma.work.findUnique({ where: { id } });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    if (work.studentId !== userId) {
      throw new ForbiddenException('Нет прав на редактирование этой работы');
    }

    if (work.status !== 'moderation') {
      throw new BadRequestException('Замена файла доступна только для работ на модерации');
    }

    // Удаляем старый файл
    await this.storageService.deleteFile(work.fileKey);

    // Декодируем имя файла
    const decodedFileName = decodeFilename(file.originalname);

    // Загружаем новый
    const { key, size } = await this.storageService.uploadFile(
      file.buffer,
      decodedFileName,
      file.mimetype,
    );

    return this.prisma.work.update({
      where: { id },
      data: {
        fileKey: key,
        fileName: decodedFileName,
        fileMime: file.mimetype,
        fileSize: size,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Удаление работы (только автор, только если на модерации)
   */
  async delete(id: string, userId: string) {
    const work = await this.prisma.work.findUnique({ where: { id } });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    if (work.studentId !== userId) {
      throw new ForbiddenException('Нет прав на удаление этой работы');
    }

    if (work.status !== 'moderation') {
      throw new BadRequestException('Удаление доступно только для работ на модерации');
    }

    // Удаляем файл из S3
    await this.storageService.deleteFile(work.fileKey);

    // Удаляем запись
    await this.prisma.work.delete({ where: { id } });

    return { message: 'Работа удалена' };
  }

  /**
   * Получение ссылки на скачивание файла
   */
  async getDownloadUrl(id: string, userId: string, userRole: Role) {
    const work = await this.findById(id, userId, userRole);

    const url = await this.storageService.getSignedDownloadUrl(work.fileKey);

    return {
      url,
      fileName: work.fileName,
      mimeType: work.fileMime,
    };
  }

  /**
   * Получение всех работ (для админа)
   */
  async findAll(params: {
    nomination?: Nomination;
    status?: WorkStatus;
    expertId?: string;
    hasExpert?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      nomination,
      status,
      expertId,
      hasExpert,
      search,
      page = 1,
      limit = 20,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (nomination) where.nomination = nomination;
    if (status) where.status = status;
    if (expertId) where.expertId = expertId;
    if (hasExpert === true) where.expertId = { not: null };
    if (hasExpert === false) where.expertId = null;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { fullName: { contains: search, mode: 'insensitive' } } },
        { student: { school: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [works, total] = await Promise.all([
      this.prisma.work.findMany({
        where,
        include: {
          student: {
            select: { id: true, fullName: true, school: true, grade: true },
          },
          expert: {
            select: { id: true, fullName: true },
          },
          rating: {
            select: { score: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.work.count({ where }),
    ]);

    return {
      data: works,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // Private methods
  // ============================================

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Недопустимый тип файла. Разрешены: PDF, DOC, DOCX, JPEG, PNG, GIF',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Размер файла не должен превышать 15 МБ');
    }
  }

  private getNominationLabel(nomination: Nomination): string {
    const labels: Record<Nomination, string> = {
      vov: 'Великая Отечественная война',
      svo: 'Специальная военная операция',
    };
    return labels[nomination] || nomination;
  }
}
