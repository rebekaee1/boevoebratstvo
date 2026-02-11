import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AssignExpertDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Статистика для дашборда
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Статистика для дашборда' })
  @ApiResponse({ status: 200, description: 'Данные статистики' })
  async getStatistics() {
    return this.adminService.getStatistics();
  }

  /**
   * Назначение эксперта на работы
   */
  @Post('assign')
  @ApiOperation({ summary: 'Назначение эксперта на работы' })
  @ApiResponse({ status: 200, description: 'Работы назначены' })
  @ApiResponse({ status: 404, description: 'Эксперт не найден' })
  async assignExpert(@Body() dto: AssignExpertDto) {
    return this.adminService.assignExpert(dto);
  }

  /**
   * Снятие эксперта с работы
   */
  @Post('unassign/:workId')
  @ApiOperation({ summary: 'Снятие эксперта с работы' })
  @ApiResponse({ status: 200, description: 'Эксперт снят' })
  @ApiResponse({ status: 400, description: 'Работа уже оценена' })
  async unassignExpert(@Param('workId', ParseUUIDPipe) workId: string) {
    return this.adminService.unassignExpert(workId);
  }

  /**
   * Автораспределение работ между экспертами
   */
  @Post('distribute')
  @ApiOperation({ summary: 'Автораспределение работ между экспертами' })
  @ApiResponse({ status: 200, description: 'Работы распределены' })
  @ApiResponse({ status: 400, description: 'Нет доступных экспертов или работ' })
  async distributeWorks() {
    return this.adminService.autoDistributeWorks();
  }

  /**
   * Экспорт всех работ в Excel
   */
  @Get('export/works')
  @ApiOperation({ summary: 'Экспорт всех работ в Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Excel файл' })
  async exportWorks(@Res() res: Response) {
    const buffer = await this.adminService.exportWorksToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="works_${new Date().toISOString().split('T')[0]}.xlsx"`,
    );

    res.send(buffer);
  }

  /**
   * Экспорт результатов в Excel
   */
  @Get('export/results')
  @ApiOperation({ summary: 'Экспорт результатов в Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'Excel файл с результатами' })
  async exportResults(@Res() res: Response) {
    const buffer = await this.adminService.exportResultsToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="results_${new Date().toISOString().split('T')[0]}.xlsx"`,
    );

    res.send(buffer);
  }
}
