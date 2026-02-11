import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO для запроса сброса пароля
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email адрес пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;
}

/**
 * DTO для установки нового пароля
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Токен сброса пароля из email',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Токен обязателен' })
  token: string;

  @ApiProperty({
    description: 'Новый пароль (минимум 6 символов)',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль слишком длинный' })
  password: string;
}

/**
 * Ответ при успешном запросе сброса пароля
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Сообщение об успехе',
    example: 'Инструкции по сбросу пароля отправлены на email',
  })
  message: string;
}
