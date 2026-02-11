import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateExpertDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Получение списка пользователей (только админ)
   */
  @Roles(Role.admin)
  @Get()
  @ApiOperation({ summary: 'Получение списка пользователей (админ)' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'isBlocked', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список пользователей с пагинацией' })
  async findAll(
    @Query('role') role?: Role,
    @Query('isBlocked', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true }))
    isBlocked?: boolean,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.findAll({ role, isBlocked, search, page, limit });
  }

  /**
   * Получение списка экспертов
   */
  @Roles(Role.admin)
  @Get('experts')
  @ApiOperation({ summary: 'Получение списка экспертов (админ)' })
  @ApiResponse({ status: 200, description: 'Список экспертов' })
  async getExperts() {
    return this.usersService.getExperts();
  }

  /**
   * Создание эксперта (только админ)
   */
  @Roles(Role.admin)
  @Post('experts')
  @ApiOperation({ summary: 'Создание эксперта (админ)' })
  @ApiResponse({ status: 201, description: 'Эксперт создан' })
  @ApiResponse({ status: 409, description: 'Email уже существует' })
  async createExpert(@Body() dto: CreateExpertDto) {
    return this.usersService.createExpert(dto);
  }

  /**
   * Получение пользователя по ID
   */
  @Roles(Role.admin)
  @Get(':id')
  @ApiOperation({ summary: 'Получение пользователя по ID (админ)' })
  @ApiResponse({ status: 200, description: 'Данные пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Обновление профиля
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Обновление профиля' })
  @ApiResponse({ status: 200, description: 'Профиль обновлён' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: Role,
  ) {
    return this.usersService.update(id, dto, currentUserId, currentUserRole);
  }

  /**
   * Блокировка пользователя (только админ)
   */
  @Roles(Role.admin)
  @Post(':id/block')
  @ApiOperation({ summary: 'Блокировка пользователя (админ)' })
  @ApiResponse({ status: 200, description: 'Пользователь заблокирован' })
  @ApiResponse({ status: 403, description: 'Нельзя заблокировать администратора' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async block(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleBlock(id, true);
  }

  /**
   * Разблокировка пользователя (только админ)
   */
  @Roles(Role.admin)
  @Post(':id/unblock')
  @ApiOperation({ summary: 'Разблокировка пользователя (админ)' })
  @ApiResponse({ status: 200, description: 'Пользователь разблокирован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async unblock(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleBlock(id, false);
  }

  /**
   * Сброс пароля пользователя (только админ)
   */
  @Roles(Role.admin)
  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Сброс пароля пользователя (админ)' })
  @ApiResponse({ status: 200, description: 'Пароль сброшен, новый пароль возвращён' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.resetPasswordByAdmin(id);
  }
}
