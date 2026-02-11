import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

/**
 * DTO для регистрации нового участника (школьника)
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Email адрес',
    example: 'student@example.com',
  })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @ApiProperty({
    description: 'Пароль (минимум 6 символов)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль слишком длинный' })
  password: string;

  @ApiProperty({
    description: 'ФИО участника',
    example: 'Иванов Иван Иванович',
  })
  @IsString()
  @IsNotEmpty({ message: 'ФИО обязательно' })
  @MinLength(2, { message: 'ФИО слишком короткое' })
  @MaxLength(200, { message: 'ФИО слишком длинное' })
  fullName: string;

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
    example: 'СОШ №1 им. Героя России',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название школы обязательно' })
  @MaxLength(300, { message: 'Название школы слишком длинное' })
  school: string;

  @ApiProperty({
    description: 'Класс (1-11)',
    example: '9',
  })
  @IsString()
  @IsNotEmpty({ message: 'Класс обязателен' })
  @Matches(/^(1[0-1]|[1-9])([А-Яа-яA-Za-z])?$/, {
    message: 'Некорректный класс (укажите 1-11)',
  })
  grade: string;

  @ApiProperty({
    description: 'Согласие на обработку персональных данных',
    example: true,
  })
  @IsBoolean({ message: 'Необходимо подтвердить согласие' })
  privacyAccepted: boolean;
}
