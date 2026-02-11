import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, CreateExpertDto } from './dto';

/**
 * Сервис управления пользователями
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получение списка всех пользователей (для админа)
   */
  async findAll(params: {
    role?: Role;
    isBlocked?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, isBlocked, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { school: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          school: true,
          grade: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: {
              submittedWorks: true,
              assignedWorks: true,
              ratings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Получение пользователя по ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        school: true,
        grade: true,
        isBlocked: true,
        privacyAccepted: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submittedWorks: true,
            assignedWorks: true,
            ratings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  /**
   * Обновление профиля пользователя
   */
  async update(id: string, dto: UpdateUserDto, currentUserId: string, currentUserRole: Role) {
    // Проверяем права: либо сам пользователь, либо админ
    if (id !== currentUserId && currentUserRole !== 'admin') {
      throw new ForbiddenException('Нет прав для редактирования этого профиля');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        school: true,
        grade: true,
      },
    });
  }

  /**
   * Блокировка/разблокировка пользователя (только админ)
   */
  async toggleBlock(id: string, block: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Нельзя заблокировать админа
    if (user.role === 'admin') {
      throw new ForbiddenException('Нельзя заблокировать администратора');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: block,
        refreshToken: block ? null : undefined, // Инвалидируем сессию при блокировке
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isBlocked: true,
      },
    });
  }

  /**
   * Создание эксперта (только админ)
   */
  async createExpert(dto: CreateExpertDto) {
    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Генерируем пароль, если не указан
    const temporaryPassword = dto.password || this.generatePassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'expert',
        privacyAccepted: true, // Эксперт создаётся админом
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return {
      ...user,
      temporaryPassword,
    };
  }

  /**
   * Сброс пароля пользователя (только админ)
   */
  async resetPasswordByAdmin(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const newPassword = this.generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        refreshToken: null,
      },
    });

    return {
      userId: id,
      email: user.email,
      newPassword,
      message: 'Пароль успешно сброшен',
    };
  }

  /**
   * Получение списка экспертов
   */
  async getExperts() {
    return this.prisma.user.findMany({
      where: {
        role: 'expert',
        isBlocked: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        _count: {
          select: {
            assignedWorks: true,
            ratings: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  // ============================================
  // Private methods
  // ============================================

  /**
   * Генерация случайного пароля
   */
  private generatePassword(length = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
