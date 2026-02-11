import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

/**
 * DTO для назначения эксперта на работу
 */
export class AssignExpertDto {
  @ApiProperty({
    description: 'ID эксперта',
    example: 'uuid-expert',
  })
  @IsUUID('4', { message: 'Некорректный ID эксперта' })
  @IsNotEmpty({ message: 'ID эксперта обязателен' })
  expertId: string;

  @ApiProperty({
    description: 'Массив ID работ для назначения',
    example: ['uuid-work-1', 'uuid-work-2'],
  })
  @IsArray({ message: 'Должен быть массив ID работ' })
  @ArrayMinSize(1, { message: 'Укажите хотя бы одну работу' })
  @IsUUID('4', { each: true, message: 'Некорректный ID работы' })
  workIds: string[];
}
