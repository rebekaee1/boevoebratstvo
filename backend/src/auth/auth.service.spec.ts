import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-token'),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    fullName: 'Иван Иванов',
    phone: '+79001234567',
    role: 'student',
    school: 'Школа №1',
    grade: '10',
    isBlocked: false,
    refreshToken: null,
    privacyAccepted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      passwordReset: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('mock-secret'),
    };

    const mockMailService = {
      sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Иван Иванов',
      phone: '+79001234567',
      school: 'Школа №1',
      grade: '10',
      privacyAccepted: true,
    };

    it('should successfully register a new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: 'student',
        school: mockUser.school,
        grade: mockUser.grade,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mailService.sendRegistrationEmail).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.fullName,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if privacy not accepted', async () => {
      const dtoWithoutPrivacy = { ...registerDto, privacyAccepted: false };

      await expect(service.register(dtoWithoutPrivacy)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for blocked user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isBlocked: true,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordReset.create as jest.Mock).mockResolvedValue({});

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(result.message).toContain('инструкции отправлены');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return success message even for non-existent email (security)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toContain('инструкции отправлены');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'valid-token',
      password: 'newPassword123',
    };

    it('should successfully reset password with valid token', async () => {
      const mockPasswordReset = {
        id: 'reset-id',
        token: 'valid-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        used: false,
        user: mockUser,
      };

      (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue(
        mockPasswordReset,
      );
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      const result = await service.resetPassword(resetDto);

      expect(result.message).toContain('успешно изменён');
    });

    it('should throw BadRequestException for invalid token', async () => {
      (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const mockPasswordReset = {
        id: 'reset-id',
        token: 'valid-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        used: false,
        user: mockUser,
      };

      (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue(
        mockPasswordReset,
      );

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for already used token', async () => {
      const mockPasswordReset = {
        id: 'reset-id',
        token: 'valid-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000),
        used: true, // Already used
        user: mockUser,
      };

      (prisma.passwordReset.findUnique as jest.Mock).mockResolvedValue(
        mockPasswordReset,
      );

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      const result = await service.logout(mockUser.id);

      expect(result.message).toContain('вышли');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: null },
      });
    });
  });
});
