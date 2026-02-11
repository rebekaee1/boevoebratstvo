import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AssignExpertDto } from './dto';
import * as ExcelJS from 'exceljs';

/**
 * Административный сервис
 * Статистика, распределение работ, экспорт
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Получение статистики для дашборда
   */
  async getStatistics() {
    const [
      totalStudents,
      totalExperts,
      totalWorks,
      worksByStatus,
      worksByNomination,
      ratedWorks,
      averageScore,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'student' } }),
      this.prisma.user.count({ where: { role: 'expert' } }),
      this.prisma.work.count(),
      this.prisma.work.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.work.groupBy({
        by: ['nomination'],
        _count: { id: true },
      }),
      this.prisma.rating.count(),
      this.prisma.rating.aggregate({
        _avg: { score: true },
      }),
    ]);

    // Работы без эксперта
    const unassignedWorks = await this.prisma.work.count({
      where: { expertId: null },
    });

    // Топ-10 школ по количеству работ
    const worksBySchool = await this.prisma.work.groupBy({
      by: ['studentId'],
      _count: { id: true },
    });

    // Получаем школы для каждого студента
    const schoolStats: Record<string, number> = {};
    const studentIds = worksBySchool.map((w) => w.studentId);
    
    if (studentIds.length > 0) {
      const students = await this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, school: true },
      });
      
      const studentSchoolMap = new Map(students.map((s) => [s.id, s.school || 'Не указана']));
      
      worksBySchool.forEach((w) => {
        const school = studentSchoolMap.get(w.studentId) || 'Не указана';
        schoolStats[school] = (schoolStats[school] || 0) + w._count.id;
      });
    }

    // Сортируем и берём топ-10
    const topSchools = Object.entries(schoolStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([school, count]) => ({ school, count }));

    return {
      users: {
        students: totalStudents,
        experts: totalExperts,
      },
      works: {
        total: totalWorks,
        unassigned: unassignedWorks,
        byStatus: worksByStatus.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count.id }),
          {},
        ),
        byNomination: worksByNomination.reduce(
          (acc, item) => ({ ...acc, [item.nomination]: item._count.id }),
          {},
        ),
        bySchool: topSchools,
      },
      ratings: {
        total: ratedWorks,
        averageScore: averageScore._avg.score
          ? Math.round(averageScore._avg.score * 100) / 100
          : null,
      },
    };
  }

  /**
   * Назначение эксперта на работы
   */
  async assignExpert(dto: AssignExpertDto) {
    // Проверяем эксперта
    const expert = await this.prisma.user.findUnique({
      where: { id: dto.expertId },
    });

    if (!expert || expert.role !== 'expert') {
      throw new NotFoundException('Эксперт не найден');
    }

    if (expert.isBlocked) {
      throw new BadRequestException('Эксперт заблокирован');
    }

    // Обновляем работы
    const result = await this.prisma.work.updateMany({
      where: {
        id: { in: dto.workIds },
        // Можно назначить только работы на модерации или без эксперта
        OR: [
          { status: 'moderation' },
          { expertId: null },
        ],
      },
      data: {
        expertId: dto.expertId,
        status: 'review', // Переводим на проверку
      },
    });

    // Отправляем уведомление эксперту о назначении работ
    if (result.count > 0) {
      this.mailService.sendWorksAssignedEmail(
        expert.email,
        expert.fullName,
        result.count,
      ).catch((err) => {
        console.error('[Admin] Error sending works assigned email:', err);
      });
    }

    return {
      assigned: result.count,
      expertId: dto.expertId,
      expertName: expert.fullName,
    };
  }

  /**
   * Снятие эксперта с работы
   */
  async unassignExpert(workId: string) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { rating: true },
    });

    if (!work) {
      throw new NotFoundException('Работа не найдена');
    }

    if (work.rating) {
      throw new BadRequestException('Нельзя снять эксперта с оценённой работы');
    }

    await this.prisma.work.update({
      where: { id: workId },
      data: {
        expertId: null,
        status: 'moderation',
      },
    });

    return { message: 'Эксперт снят с работы' };
  }

  /**
   * Автоматическое распределение работ между экспертами
   * Распределяет равномерно, учитывая текущую нагрузку
   */
  async autoDistributeWorks() {
    // Получаем все работы без эксперта (на модерации)
    const unassignedWorks = await this.prisma.work.findMany({
      where: {
        expertId: null,
        status: 'moderation',
      },
      select: { id: true },
    });

    if (unassignedWorks.length === 0) {
      throw new BadRequestException('Нет работ для распределения');
    }

    // Получаем всех активных экспертов с их текущей нагрузкой
    const experts = await this.prisma.user.findMany({
      where: {
        role: 'expert',
        isBlocked: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: {
          select: {
            assignedWorks: {
              where: { status: { not: 'rated' } }, // Только незавершённые
            },
          },
        },
      },
    });

    if (experts.length === 0) {
      throw new BadRequestException('Нет доступных экспертов');
    }

    // Сортируем экспертов по нагрузке (от меньшей к большей)
    const sortedExperts = experts.sort(
      (a, b) => a._count.assignedWorks - b._count.assignedWorks,
    );

    // Распределяем работы равномерно
    const assignments: { expertId: string; workIds: string[] }[] = sortedExperts.map(
      (e) => ({ expertId: e.id, workIds: [] }),
    );

    let currentExpertIndex = 0;
    for (const work of unassignedWorks) {
      assignments[currentExpertIndex].workIds.push(work.id);
      currentExpertIndex = (currentExpertIndex + 1) % experts.length;
    }

    // Выполняем назначения
    const results = await Promise.all(
      assignments
        .filter((a) => a.workIds.length > 0)
        .map(async (assignment) => {
          const result = await this.prisma.work.updateMany({
            where: { id: { in: assignment.workIds } },
            data: {
              expertId: assignment.expertId,
              status: 'review',
            },
          });

          // Отправляем уведомление эксперту
          const expert = sortedExperts.find((e) => e.id === assignment.expertId);
          if (expert && result.count > 0) {
            this.mailService.sendWorksAssignedEmail(
              expert.email,
              expert.fullName,
              result.count,
            ).catch((err) => {
              console.error('[Admin] Error sending works assigned email:', err);
            });
          }

          return {
            expertId: assignment.expertId,
            expertName: expert?.fullName,
            assigned: result.count,
          };
        }),
    );

    return {
      totalDistributed: unassignedWorks.length,
      expertsCount: results.filter((r) => r.assigned > 0).length,
      details: results,
    };
  }

  /**
   * Экспорт всех работ в Excel
   */
  async exportWorksToExcel(): Promise<Buffer> {
    const works = await this.prisma.work.findMany({
      include: {
        student: {
          select: { fullName: true, email: true, school: true, grade: true },
        },
        expert: {
          select: { fullName: true },
        },
        rating: {
          select: { score: true, comment: true },
        },
      },
      orderBy: [{ nomination: 'asc' }, { createdAt: 'asc' }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Наследники Победы';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Работы');

    // Заголовки
    sheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Название', key: 'title', width: 40 },
      { header: 'Номинация', key: 'nomination', width: 15 },
      { header: 'Тип', key: 'workType', width: 12 },
      { header: 'Участник', key: 'student', width: 30 },
      { header: 'Школа', key: 'school', width: 40 },
      { header: 'Класс', key: 'grade', width: 8 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Эксперт', key: 'expert', width: 25 },
      { header: 'Оценка', key: 'score', width: 10 },
      { header: 'Комментарий', key: 'comment', width: 50 },
      { header: 'Дата подачи', key: 'createdAt', width: 18 },
    ];

    // Стилизация заголовков
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D2137' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Данные
    const nominationLabels: Record<string, string> = {
      vov: 'ВОВ',
      svo: 'СВО',
    };

    const workTypeLabels: Record<string, string> = {
      essay: 'Сочинение',
      drawing: 'Рисунок',
    };

    const statusLabels: Record<string, string> = {
      moderation: 'На модерации',
      review: 'На проверке',
      rated: 'Оценено',
    };

    works.forEach((work, index) => {
      sheet.addRow({
        num: index + 1,
        title: work.title,
        nomination: nominationLabels[work.nomination] || work.nomination,
        workType: workTypeLabels[work.workType] || work.workType,
        student: work.student.fullName,
        school: work.student.school || '',
        grade: work.student.grade || '',
        status: statusLabels[work.status] || work.status,
        expert: work.expert?.fullName || '-',
        score: work.rating?.score ?? '-',
        comment: work.rating?.comment || '',
        createdAt: work.createdAt.toLocaleString('ru-RU'),
      });
    });

    // Автофильтр
    sheet.autoFilter = {
      from: 'A1',
      to: 'L1',
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Экспорт результатов (только оценённые работы)
   */
  async exportResultsToExcel(): Promise<Buffer> {
    const works = await this.prisma.work.findMany({
      where: { status: 'rated' },
      include: {
        student: {
          select: { fullName: true, school: true, grade: true },
        },
        rating: {
          select: { score: true, comment: true },
        },
      },
      orderBy: [{ nomination: 'asc' }, { rating: { score: 'desc' } }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Наследники Победы';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Результаты');

    sheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Место', key: 'place', width: 8 },
      { header: 'Название', key: 'title', width: 40 },
      { header: 'Номинация', key: 'nomination', width: 15 },
      { header: 'Участник', key: 'student', width: 30 },
      { header: 'Школа', key: 'school', width: 40 },
      { header: 'Класс', key: 'grade', width: 8 },
      { header: 'Оценка', key: 'score', width: 10 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4A017' },
    };

    const nominationLabels: Record<string, string> = {
      vov: 'ВОВ',
      svo: 'СВО',
    };

    // Группируем по номинациям для расчёта мест
    const byNomination: Record<string, typeof works> = {};
    works.forEach((work) => {
      if (!byNomination[work.nomination]) {
        byNomination[work.nomination] = [];
      }
      byNomination[work.nomination].push(work);
    });

    let rowNum = 0;
    Object.entries(byNomination).forEach(([nomination, nominationWorks]) => {
      // Сортируем по оценке
      nominationWorks.sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0));

      nominationWorks.forEach((work, index) => {
        rowNum++;
        sheet.addRow({
          num: rowNum,
          place: index + 1,
          title: work.title,
          nomination: nominationLabels[nomination] || nomination,
          student: work.student.fullName,
          school: work.student.school || '',
          grade: work.student.grade || '',
          score: work.rating?.score ?? '-',
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
