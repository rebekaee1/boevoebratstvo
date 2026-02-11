import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, MaxLength } from 'class-validator';
import { Nomination, WorkType } from '@prisma/client';

/**
 * DTO для подачи работы на конкурс
 */
export class CreateWorkDto {
  @ApiProperty({
    description: 'Название работы',
    example: 'Письмо прадедушке',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название работы обязательно' })
  @MaxLength(300, { message: 'Название слишком длинное' })
  title: string;

  @ApiProperty({
    description: 'Номинация: vov - ВОВ, svo - СВО',
    enum: Nomination,
    example: 'vov',
  })
  @IsEnum(Nomination, { message: 'Некорректная номинация (vov или svo)' })
  @IsNotEmpty({ message: 'Номинация обязательна' })
  nomination: Nomination;

  @ApiProperty({
    description: 'Тип работы: essay - сочинение, drawing - рисунок',
    enum: WorkType,
    example: 'essay',
  })
  @IsEnum(WorkType, { message: 'Некорректный тип работы (essay или drawing)' })
  @IsNotEmpty({ message: 'Тип работы обязателен' })
  workType: WorkType;
}
