import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Сервис аутентификации
 * Обрабатывает регистрацию, вход, JWT токены и сброс пароля
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Регистрация нового участника (школьника)
   */
  async register(dto: RegisterDto) {
    // Проверяем согласие на обработку ПДн
    if (!dto.privacyAccepted) {
      throw new BadRequestException('Необходимо согласие на обработку персональных данных');
    }

    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Создаём пользователя
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        school: dto.school,
        grade: dto.grade,
        privacyAccepted: dto.privacyAccepted,
        role: 'student',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        school: true,
        grade: true,
      },
    });

    // Генерируем токены
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Сохраняем refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Отправляем приветственное письмо
    this.mailService.sendRegistrationEmail(user.email, user.fullName).catch((err) => {
      console.error('[Auth] Error sending registration email:', err);
    });

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Вход в систему
   */
  async login(dto: LoginDto) {
    // Ищем пользователя
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Проверяем блокировку
    if (user.isBlocked) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Генерируем токены
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Сохраняем refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        school: user.school,
        grade: user.grade,
      },
    };
  }

  /**
   * Обновление токенов по refresh token
   */
  async refreshTokens(dto: RefreshTokenDto) {
    try {
      // Верифицируем refresh token
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      // Ищем пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Недействительный токен');
      }

      // Проверяем, совпадает ли refresh token
      const isRefreshTokenValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Недействительный токен');
      }

      // Проверяем блокировку
      if (user.isBlocked) {
        throw new UnauthorizedException('Аккаунт заблокирован');
      }

      // Генерируем новые токены
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Обновляем refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          school: user.school,
          grade: user.grade,
        },
      };
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  /**
   * Выход из системы (инвалидация refresh token)
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Вы успешно вышли из системы' };
  }

  /**
   * Запрос сброса пароля
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Всегда возвращаем успех (для безопасности не раскрываем существование email)
    if (!user) {
      return { message: 'Если email существует, инструкции отправлены на почту' };
    }

    // Генерируем токен сброса
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    // Сохраняем токен
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Отправляем email с ссылкой для сброса пароля
    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Если email существует, инструкции отправлены на почту' };
  }

  /**
   * Установка нового пароля
   */
  async resetPassword(dto: ResetPasswordDto) {
    // Ищем токен
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!passwordReset) {
      throw new BadRequestException('Недействительная ссылка для сброса пароля');
    }

    // Проверяем срок действия
    if (passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('Срок действия ссылки истёк');
    }

    // Проверяем, не использован ли токен
    if (passwordReset.used) {
      throw new BadRequestException('Ссылка уже была использована');
    }

    // Хешируем новый пароль
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Обновляем пароль и помечаем токен как использованный
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash, refreshToken: null },
      }),
      this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Пароль успешно изменён' };
  }

  /**
   * Получение профиля текущего пользователя
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        school: true,
        grade: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }

  // ============================================
  // Private methods
  // ============================================

  /**
   * Генерация пары токенов (access + refresh)
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Сохранение хеша refresh token в БД
   */
  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
