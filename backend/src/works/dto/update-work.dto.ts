import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO для обновления работы (только на модерации)
 */
export class UpdateWorkDto {
  @ApiProperty({
    description: 'Название работы',
    example: 'Обновлённое название',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;
}
