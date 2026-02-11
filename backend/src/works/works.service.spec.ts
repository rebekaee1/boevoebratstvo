import { Test, TestingModule } from '@nestjs/testing';
import { WorksService } from './works.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Nomination, WorkType, WorkStatus } from '@prisma/client';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('WorksService', () => {
  let service: WorksService;
  let prisma: jest.Mocked<PrismaService>;
  let storageService: jest.Mocked<StorageService>;
  let mailService: jest.Mocked<MailService>;

  const mockStudent = {
    id: 'student-id-123',
    email: 'student@example.com',
    fullName: 'Иван Иванов',
    school: 'Школа №1',
    grade: '10',
  };

  const mockWork = {
    id: 'work-id-123',
    title: 'Моя работа о войне',
    nomination: 'vov' as Nomination,
    workType: 'essay' as WorkType,
    fileKey: 'works/abc123.pdf',
    fileName: 'essay.pdf',
    fileMime: 'application/pdf',
    fileSize: 1024000,
    status: 'moderation' as WorkStatus,
    studentId: mockStudent.id,
    expertId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024000,
    buffer: Buffer.from('test content'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      work: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      setting: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockStorageService = {
      uploadFile: jest.fn().mockResolvedValue({
        key: 'works/abc123.pdf',
        size: 1024000,
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: jest.fn().mockResolvedValue('https://signed-url.com'),
    };

    const mockMailService = {
      sendWorkSubmittedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<WorksService>(WorksService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'Моя работа о войне',
      nomination: 'vov' as Nomination,
      workType: 'essay' as WorkType,
    };

    it('should successfully create a work', async () => {
      (prisma.work.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: new Date(Date.now() + 86400000).toISOString(), // Завтра
      });
      (prisma.work.create as jest.Mock).mockResolvedValue({
        id: mockWork.id,
        title: createDto.title,
        nomination: createDto.nomination,
        workType: createDto.workType,
        fileName: 'test.pdf',
        fileSize: 1024000,
        status: 'moderation',
        createdAt: new Date(),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const result = await service.create(createDto, mockFile, mockStudent.id);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(createDto.title);
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(mailService.sendWorkSubmittedEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if work already exists in nomination', async () => {
      (prisma.work.findFirst as jest.Mock).mockResolvedValue(mockWork);

      await expect(
        service.create(createDto, mockFile, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if deadline has passed', async () => {
      (prisma.work.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: new Date(Date.now() - 86400000).toISOString(), // Вчера
      });

      await expect(
        service.create(createDto, mockFile, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/exe' };

      await expect(
        service.create(createDto, invalidFile as Express.Multer.File, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 20 * 1024 * 1024 }; // 20 MB

      await expect(
        service.create(createDto, largeFile as Express.Multer.File, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should successfully update a work on moderation', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(mockWork);
      (prisma.work.update as jest.Mock).mockResolvedValue({
        ...mockWork,
        title: 'Новое название',
      });

      const result = await service.update(
        mockWork.id,
        { title: 'Новое название' },
        mockStudent.id,
      );

      expect(result.title).toBe('Новое название');
    });

    it('should throw NotFoundException for non-existent work', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'Test' }, mockStudent.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the owner', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(mockWork);

      await expect(
        service.update(mockWork.id, { title: 'Test' }, 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if work is not on moderation', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue({
        ...mockWork,
        status: 'review',
      });

      await expect(
        service.update(mockWork.id, { title: 'Test' }, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should successfully delete a work on moderation', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(mockWork);
      (prisma.work.delete as jest.Mock).mockResolvedValue(mockWork);

      const result = await service.delete(mockWork.id, mockStudent.id);

      expect(result.message).toContain('удалена');
      expect(storageService.deleteFile).toHaveBeenCalledWith(mockWork.fileKey);
    });

    it('should throw NotFoundException for non-existent work', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.delete('non-existent', mockStudent.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the owner', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(mockWork);

      await expect(
        service.delete(mockWork.id, 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for rated work', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue({
        ...mockWork,
        status: 'rated',
      });

      await expect(
        service.delete(mockWork.id, mockStudent.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return work for the owner', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue({
        ...mockWork,
        student: mockStudent,
        expert: null,
        rating: null,
      });

      const result = await service.findById(
        mockWork.id,
        mockStudent.id,
        'student',
      );

      expect(result.id).toBe(mockWork.id);
    });

    it('should return work for admin', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue({
        ...mockWork,
        student: mockStudent,
        expert: null,
        rating: null,
      });

      const result = await service.findById(
        mockWork.id,
        'admin-id',
        'admin',
      );

      expect(result.id).toBe(mockWork.id);
    });

    it('should throw NotFoundException for non-existent work', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findById('non-existent', mockStudent.id, 'student'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      (prisma.work.findUnique as jest.Mock).mockResolvedValue({
        ...mockWork,
        student: mockStudent,
        expert: null,
        rating: null,
      });

      await expect(
        service.findById(mockWork.id, 'other-student-id', 'student'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findMyWorks', () => {
    it('should return works for a student', async () => {
      (prisma.work.findMany as jest.Mock).mockResolvedValue([mockWork]);

      const result = await service.findMyWorks(mockStudent.id);

      expect(result).toHaveLength(1);
      expect(prisma.work.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: mockStudent.id },
        }),
      );
    });
  });
});
