import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, MaxLength, IsUUID } from 'class-validator';

/**
 * DTO для создания/обновления оценки работы
 */
export class CreateRatingDto {
  @ApiProperty({
    description: 'ID работы',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'Некорректный ID работы' })
  @IsNotEmpty({ message: 'ID работы обязателен' })
  workId: string;

  @ApiProperty({
    description: 'Балл оценки',
    example: 8,
    minimum: 1,
    maximum: 10,
  })
  @IsInt({ message: 'Оценка должна быть целым числом' })
  @Min(1, { message: 'Минимальная оценка: 1' })
  @Max(10, { message: 'Максимальная оценка: 10' })
  score: number;

  @ApiProperty({
    description: 'Комментарий эксперта',
    example: 'Отличная работа! Глубокий анализ темы.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Комментарий слишком длинный (макс. 2000 символов)' })
  comment?: string;
}
