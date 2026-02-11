import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

/**
 * DTO для обновления профиля пользователя
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'ФИО',
    example: 'Иванов Иван Иванович',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiProperty({
    description: 'Номер телефона',
    example: '+79781234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, { message: 'Некорректный номер телефона' })
  phone?: string;

  @ApiProperty({
    description: 'Название школы',
    example: 'СОШ №1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  school?: string;

  @ApiProperty({
    description: 'Класс',
    example: '9А',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(1[0-1]|[1-9])([А-Яа-яA-Za-z])?$/, {
    message: 'Некорректный класс',
  })
  grade?: string;
}
