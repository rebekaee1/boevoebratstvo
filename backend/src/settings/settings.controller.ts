import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, SettingsResponseDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, Public } from '../common/decorators';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Получение настроек (публичный)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Получение настроек' })
  @ApiResponse({ status: 200, description: 'Настройки системы', type: SettingsResponseDto })
  async getAll() {
    return this.settingsService.getAll();
  }

  /**
   * Проверка: открыт ли приём работ
   */
  @Public()
  @Get('submission-status')
  @ApiOperation({ summary: 'Проверка статуса приёма работ' })
  @ApiResponse({ status: 200, description: 'Статус приёма работ' })
  async getSubmissionStatus() {
    const isOpen = await this.settingsService.isSubmissionOpen();
    const settings = await this.settingsService.getAll();
    return {
      isOpen,
      deadline: settings.submissionDeadline,
    };
  }

  /**
   * Обновление настроек (админ)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Обновление настроек (админ)' })
  @ApiResponse({ status: 200, description: 'Настройки обновлены', type: SettingsResponseDto })
  async update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
