import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO для входа в систему
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email адрес',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный email адрес' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @ApiProperty({
    description: 'Пароль',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(1, { message: 'Введите пароль' })
  password: string;
}

/**
 * Ответ при успешной аутентификации
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token (15 мин)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT Refresh Token (7 дней)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Данные пользователя',
  })
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    school?: string;
    grade?: string;
  };
}
