import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto';

/**
 * Сервис управления настройками системы
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получение всех настроек
   */
  async getAll() {
    const [deadlineSetting, scaleSetting] = await Promise.all([
      this.prisma.setting.findUnique({ where: { key: 'submission_deadline' } }),
      this.prisma.setting.findUnique({ where: { key: 'rating_scale' } }),
    ]);

    return {
      submissionDeadline: deadlineSetting?.value as string | null,
      maxScore: (scaleSetting?.value as { max?: number })?.max || 10,
    };
  }

  /**
   * Обновление настроек
   */
  async update(dto: UpdateSettingsDto) {
    const updates: Promise<any>[] = [];

    if (dto.submissionDeadline !== undefined) {
      updates.push(
        this.prisma.setting.upsert({
          where: { key: 'submission_deadline' },
          update: { value: dto.submissionDeadline },
          create: { key: 'submission_deadline', value: dto.submissionDeadline },
        }),
      );
    }

    if (dto.maxScore !== undefined) {
      updates.push(
        this.prisma.setting.upsert({
          where: { key: 'rating_scale' },
          update: { value: { min: 1, max: dto.maxScore } },
          create: { key: 'rating_scale', value: { min: 1, max: dto.maxScore } },
        }),
      );
    }

    await Promise.all(updates);

    return this.getAll();
  }

  /**
   * Проверка: открыт ли приём работ
   */
  async isSubmissionOpen(): Promise<boolean> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'submission_deadline' },
    });

    if (!setting?.value) {
      return true; // Если дедлайн не установлен - приём открыт
    }

    const deadline = new Date(setting.value as string);
    return new Date() <= deadline;
  }

  /**
   * Получение шкалы оценки
   */
  async getRatingScale(): Promise<{ min: number; max: number }> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'rating_scale' },
    });

    return (setting?.value as { min: number; max: number }) || { min: 1, max: 10 };
  }
}
