import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

/**
 * DTO для создания эксперта (только администратор)
 */
export class CreateExpertDto {
  @ApiProperty({
    description: 'Email эксперта',
    example: 'expert@example.com',
  })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @ApiProperty({
    description: 'ФИО эксперта',
    example: 'Петров Пётр Петрович',
  })
  @IsString()
  @IsNotEmpty({ message: 'ФИО обязательно' })
  @MaxLength(200)
  fullName: string;

  @ApiProperty({
    description: 'Пароль (если не указан, генерируется автоматически)',
    example: 'securePassword123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password?: string;

  @ApiProperty({
    description: 'Телефон',
    example: '+79781234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * Ответ при создании эксперта
 */
export class CreateExpertResponseDto {
  @ApiProperty({ description: 'ID эксперта' })
  id: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'ФИО' })
  fullName: string;

  @ApiProperty({ description: 'Временный пароль (показывается только при создании)' })
  temporaryPassword: string;
}
