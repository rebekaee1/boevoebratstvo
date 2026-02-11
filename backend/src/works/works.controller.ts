import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Role, Nomination, WorkStatus } from '@prisma/client';
import { WorksService } from './works.service';
import { CreateWorkDto, UpdateWorkDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@ApiTags('works')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  /**
   * Подача работы на конкурс
   */
  @Roles(Role.student)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Подача работы на конкурс (участник)' })
  @ApiBody({
    description: 'Файл работы и метаданные',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Название работы' },
        nomination: { type: 'string', enum: ['vov', 'svo'] },
        workType: { type: 'string', enum: ['essay', 'drawing'] },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'nomination', 'workType', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Работа подана' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или дедлайн прошёл' })
  async create(
    @Body() dto: CreateWorkDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') studentId: string,
  ) {
    return this.worksService.create(dto, file, studentId);
  }

  /**
   * Мои работы (для участника)
   */
  @Roles(Role.student)
  @Get('my')
  @ApiOperation({ summary: 'Получение своих работ (участник)' })
  @ApiResponse({ status: 200, description: 'Список работ участника' })
  async findMyWorks(@CurrentUser('id') studentId: string) {
    return this.worksService.findMyWorks(studentId);
  }

  /**
   * Назначенные работы (для эксперта)
   */
  @Roles(Role.expert)
  @Get('assigned')
  @ApiOperation({ summary: 'Получение назначенных работ (эксперт)' })
  @ApiResponse({ status: 200, description: 'Список работ для оценки' })
  async findAssignedWorks(@CurrentUser('id') expertId: string) {
    return this.worksService.findAssignedWorks(expertId);
  }

  /**
   * Все работы (для админа)
   */
  @Roles(Role.admin)
  @Get()
  @ApiOperation({ summary: 'Получение всех работ (админ)' })
  @ApiQuery({ name: 'nomination', required: false, enum: Nomination })
  @ApiQuery({ name: 'status', required: false, enum: WorkStatus })
  @ApiQuery({ name: 'expertId', required: false, type: String })
  @ApiQuery({ name: 'hasExpert', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список всех работ с пагинацией' })
  async findAll(
    @Query('nomination') nomination?: Nomination,
    @Query('status') status?: WorkStatus,
    @Query('expertId') expertId?: string,
    @Query('hasExpert', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true }))
    hasExpert?: boolean,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.worksService.findAll({
      nomination,
      status,
      expertId,
      hasExpert,
      search,
      page,
      limit,
    });
  }

  /**
   * Получение работы по ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Получение работы по ID' })
  @ApiResponse({ status: 200, description: 'Данные работы' })
  @ApiResponse({ status: 404, description: 'Работа не найдена' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.worksService.findById(id, userId, userRole);
  }

  /**
   * Обновление работы
   */
  @Roles(Role.student)
  @Patch(':id')
  @ApiOperation({ summary: 'Обновление работы (только на модерации)' })
  @ApiResponse({ status: 200, description: 'Работа обновлена' })
  @ApiResponse({ status: 400, description: 'Редактирование недоступно' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.worksService.update(id, dto, userId);
  }

  /**
   * Замена файла работы
   */
  @Roles(Role.student)
  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Замена файла работы (только на модерации)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Файл заменён' })
  @ApiResponse({ status: 400, description: 'Замена недоступна' })
  async replaceFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.worksService.replaceFile(id, file, userId);
  }

  /**
   * Удаление работы
   */
  @Roles(Role.student)
  @Delete(':id')
  @ApiOperation({ summary: 'Удаление работы (только на модерации)' })
  @ApiResponse({ status: 200, description: 'Работа удалена' })
  @ApiResponse({ status: 400, description: 'Удаление недоступно' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.worksService.delete(id, userId);
  }

  /**
   * Получение ссылки на скачивание файла
   */
  @Get(':id/download')
  @ApiOperation({ summary: 'Получение ссылки на скачивание файла' })
  @ApiResponse({ status: 200, description: 'Ссылка на файл' })
  @ApiResponse({ status: 404, description: 'Работа не найдена' })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.worksService.getDownloadUrl(id, userId, userRole);
  }
}
