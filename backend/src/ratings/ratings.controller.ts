import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@ApiTags('ratings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * Создание/обновление оценки работы (эксперт)
   */
  @Roles(Role.expert)
  @Post()
  @ApiOperation({ summary: 'Создание/обновление оценки (эксперт)' })
  @ApiResponse({ status: 201, description: 'Оценка сохранена' })
  @ApiResponse({ status: 403, description: 'Работа не назначена этому эксперту' })
  @ApiResponse({ status: 404, description: 'Работа не найдена' })
  async createOrUpdate(
    @Body() dto: CreateRatingDto,
    @CurrentUser('id') expertId: string,
  ) {
    return this.ratingsService.createOrUpdate(dto, expertId);
  }

  /**
   * Мои оценки (эксперт)
   */
  @Roles(Role.expert)
  @Get('my')
  @ApiOperation({ summary: 'Получение своих оценок (эксперт)' })
  @ApiResponse({ status: 200, description: 'Список выставленных оценок' })
  async findMyRatings(@CurrentUser('id') expertId: string) {
    return this.ratingsService.findMyRatings(expertId);
  }

  /**
   * Получение оценки работы по ID работы
   */
  @Get('work/:workId')
  @ApiOperation({ summary: 'Получение оценки по ID работы' })
  @ApiResponse({ status: 200, description: 'Данные оценки' })
  @ApiResponse({ status: 404, description: 'Работа или оценка не найдена' })
  async findByWorkId(
    @Param('workId', ParseUUIDPipe) workId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.ratingsService.findByWorkId(workId, userId, userRole);
  }

  /**
   * Удаление оценки (админ)
   */
  @Roles(Role.admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Удаление оценки (админ)' })
  @ApiResponse({ status: 200, description: 'Оценка удалена' })
  @ApiResponse({ status: 404, description: 'Оценка не найдена' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.ratingsService.delete(id);
  }
}
