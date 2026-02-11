import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateRatingDto } from './dto';

/**
 * Сервис управления оценками работ
 */
@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Создание/обновление оценки работы
   * Только эксперт, которому назначена работа
   */
  async createOrUpdate(dto: CreateRatingDto, expertId: string) {
    // Проверяем, существует ли работа и назначена ли она этому эксперту
    const work = await this.prisma.work.findUnique({
      where: { id: dto.workId },
      include: { rating: true },
    });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    if (work.expertId !== expertId) {
      throw new ForbiddenException('Эта работа не назначена вам для оценки');
    }

    if (work.status === 'moderation') {
      throw new BadRequestException('Работа ещё не назначена на проверку');
    }

    // Получаем шкалу оценки из настроек
    const scaleSetting = await this.prisma.setting.findUnique({
      where: { key: 'rating_scale' },
    });
    const maxScore = (scaleSetting?.value as { max?: number })?.max || 10;

    if (dto.score > maxScore) {
      throw new BadRequestException(`Максимальная оценка: ${maxScore}`);
    }

    // Если оценка уже существует - обновляем
    if (work.rating) {
      const rating = await this.prisma.rating.update({
        where: { id: work.rating.id },
        data: {
          score: dto.score,
          comment: dto.comment,
        },
        include: {
          work: {
            select: { id: true, title: true, nomination: true },
          },
        },
      });

      return rating;
    }

    // Создаём новую оценку и обновляем статус работы
    const rating = await this.prisma.$transaction(async (tx) => {
      const newRating = await tx.rating.create({
        data: {
          workId: dto.workId,
          expertId,
          score: dto.score,
          comment: dto.comment,
        },
        include: {
          work: {
            select: { id: true, title: true, nomination: true },
          },
        },
      });

      // Обновляем статус работы на "rated"
      await tx.work.update({
        where: { id: dto.workId },
        data: { status: 'rated' },
      });

      return newRating;
    });

    // Отправляем уведомление участнику об оценке
    const student = await this.prisma.user.findFirst({
      where: {
        submittedWorks: {
          some: { id: dto.workId },
        },
      },
      select: { email: true, fullName: true },
    });
    if (student) {
      this.mailService.sendWorkRatedEmail(
        student.email,
        student.fullName,
        work.title || 'Ваша работа',
        dto.score,
        dto.comment,
      ).catch((err) => {
        console.error('[Ratings] Error sending work rated email:', err);
      });
    }

    return rating;
  }

  /**
   * Получение оценки по ID работы
   */
  async findByWorkId(workId: string, userId: string, userRole: string) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: {
        rating: {
          include: {
            expert: {
              select: { id: true, fullName: true },
            },
          },
        },
        student: {
          select: { id: true },
        },
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

    if (!work.rating) {
      return null;
    }

    return work.rating;
  }

  /**
   * Получение всех оценок эксперта
   */
  async findMyRatings(expertId: string) {
    return this.prisma.rating.findMany({
      where: { expertId },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            nomination: true,
            workType: true,
            student: {
              select: { id: true, fullName: true, school: true, grade: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Удаление оценки (только админ)
   */
  async delete(ratingId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Оценка не найдена');
    }

    // Возвращаем статус работы на "review"
    await this.prisma.$transaction([
      this.prisma.rating.delete({ where: { id: ratingId } }),
      this.prisma.work.update({
        where: { id: rating.workId },
        data: { status: 'review' },
      }),
    ]);

    return { message: 'Оценка удалена' };
  }
}
