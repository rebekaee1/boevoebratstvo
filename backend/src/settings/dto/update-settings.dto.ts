import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

/**
 * DTO для обновления настроек системы
 */
export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Дедлайн подачи работ (ISO 8601)',
    example: '2025-05-09T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Некорректный формат даты' })
  submissionDeadline?: string;

  @ApiProperty({
    description: 'Максимальный балл оценки',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Максимальный балл должен быть целым числом' })
  @Min(1, { message: 'Минимальный балл: 1' })
  @Max(100, { message: 'Максимальный балл: 100' })
  maxScore?: number;
}

/**
 * Ответ с настройками
 */
export class SettingsResponseDto {
  @ApiProperty({ description: 'Дедлайн подачи работ', nullable: true })
  submissionDeadline: string | null;

  @ApiProperty({ description: 'Максимальный балл оценки' })
  maxScore: number;
}
