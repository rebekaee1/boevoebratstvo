import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Сервис отправки email уведомлений
 */
@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SMTP_FROM', 'noreply@nasledniki-pobedy.ru');

    const smtpUser = this.configService.get<string>('SMTP_USER', '');
    const smtpPass = this.configService.get<string>('SMTP_PASS', '');

    // Конфигурация транспорта
    const transportConfig: nodemailer.TransportOptions = {
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: false, // true для 465, false для других портов
    } as any;

    // Добавляем auth только если есть credentials (для MailHog не нужно)
    if (smtpUser && smtpPass) {
      (transportConfig as any).auth = {
        user: smtpUser,
        pass: smtpPass,
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  /**
   * Отправка email
   */
  private async sendMail(options: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Наследники Победы" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[Mail] Sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error(`[Mail] Error sending to ${options.to}:`, error);
      // Не выбрасываем ошибку, чтобы не блокировать основной процесс
    }
  }

  /**
   * Уведомление об успешной регистрации
   */
  async sendRegistrationEmail(email: string, fullName: string): Promise<void> {
    const html = this.getTemplate('registration', {
      fullName,
      loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
    });

    await this.sendMail({
      to: email,
      subject: 'Добро пожаловать в конкурс «Наследники Победы»!',
      html,
    });
  }

  /**
   * Уведомление о сбросе пароля
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    const html = this.getTemplate('password-reset', {
      resetUrl,
    });

    await this.sendMail({
      to: email,
      subject: 'Сброс пароля — Наследники Победы',
      html,
    });
  }

  /**
   * Уведомление о подаче работы
   */
  async sendWorkSubmittedEmail(
    email: string,
    fullName: string,
    workTitle: string,
    nomination: string,
  ): Promise<void> {
    const html = this.getTemplate('work-submitted', {
      fullName,
      workTitle,
      nomination,
      dashboardUrl: `${this.configService.get('FRONTEND_URL')}/student`,
    });

    await this.sendMail({
      to: email,
      subject: `Ваша работа «${workTitle}» принята!`,
      html,
    });
  }

  /**
   * Уведомление об оценке работы
   */
  async sendWorkRatedEmail(
    email: string,
    fullName: string,
    workTitle: string,
    score: number,
    comment?: string,
  ): Promise<void> {
    const html = this.getTemplate('work-rated', {
      fullName,
      workTitle,
      score,
      comment: comment || 'Комментарий не добавлен',
      dashboardUrl: `${this.configService.get('FRONTEND_URL')}/student`,
    });

    await this.sendMail({
      to: email,
      subject: `Ваша работа «${workTitle}» оценена!`,
      html,
    });
  }

  /**
   * Уведомление эксперту о назначении работ
   */
  async sendWorksAssignedEmail(
    email: string,
    expertName: string,
    worksCount: number,
  ): Promise<void> {
    const html = this.getTemplate('works-assigned', {
      expertName,
      worksCount,
      dashboardUrl: `${this.configService.get('FRONTEND_URL')}/expert`,
    });

    await this.sendMail({
      to: email,
      subject: `Вам назначено ${worksCount} работ для оценки`,
      html,
    });
  }

  // ============================================
  // Шаблоны
  // ============================================

  private getTemplate(
    templateName: string,
    data: Record<string, string | number>,
  ): string {
    const baseStyles = `
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #0d2137 0%, #1a3a5c 100%); padding: 30px; text-align: center; }
      .header h1 { color: #d4a017; margin: 0; font-size: 24px; }
      .content { padding: 30px; color: #333; line-height: 1.6; }
      .button { display: inline-block; background: linear-gradient(to right, #d4a017, #f5b81c); color: #0d2137 !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      .highlight { background: #fff8e7; padding: 15px; border-radius: 8px; border-left: 4px solid #d4a017; margin: 15px 0; }
    `;

    const templates: Record<string, string> = {
      registration: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎖️ Наследники Победы</h1></div>
            <div class="content">
              <h2>Добро пожаловать, ${data.fullName}!</h2>
              <p>Вы успешно зарегистрировались на региональном конкурсе творческих работ «Наследники Победы».</p>
              <p>Теперь вы можете подать свою работу в одной из номинаций:</p>
              <div class="highlight">
                <strong>• Великая Отечественная война</strong><br>
                <strong>• Специальная военная операция</strong>
              </div>
              <p>Не забудьте ознакомиться с правилами и сроками подачи работ.</p>
              <a href="${data.loginUrl}" class="button">Войти в личный кабинет</a>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Наследники Победы. Севастополь.</div>
          </div>
        </body>
        </html>
      `,
      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎖️ Наследники Победы</h1></div>
            <div class="content">
              <h2>Сброс пароля</h2>
              <p>Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы создать новый пароль:</p>
              <a href="${data.resetUrl}" class="button">Сбросить пароль</a>
              <p><small>Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</small></p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Наследники Победы. Севастополь.</div>
          </div>
        </body>
        </html>
      `,
      'work-submitted': `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎖️ Наследники Победы</h1></div>
            <div class="content">
              <h2>Работа принята!</h2>
              <p>Уважаемый(ая) ${data.fullName},</p>
              <p>Ваша работа успешно загружена и принята на конкурс:</p>
              <div class="highlight">
                <strong>Название:</strong> ${data.workTitle}<br>
                <strong>Номинация:</strong> ${data.nomination}
              </div>
              <p>После проверки экспертом вы получите уведомление с оценкой.</p>
              <a href="${data.dashboardUrl}" class="button">Перейти в личный кабинет</a>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Наследники Победы. Севастополь.</div>
          </div>
        </body>
        </html>
      `,
      'work-rated': `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎖️ Наследники Победы</h1></div>
            <div class="content">
              <h2>Ваша работа оценена!</h2>
              <p>Уважаемый(ая) ${data.fullName},</p>
              <p>Эксперт оценил вашу работу:</p>
              <div class="highlight">
                <strong>Название:</strong> ${data.workTitle}<br>
                <strong>Оценка:</strong> ⭐ ${data.score} баллов<br>
                <strong>Комментарий:</strong> ${data.comment}
              </div>
              <a href="${data.dashboardUrl}" class="button">Посмотреть подробности</a>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Наследники Победы. Севастополь.</div>
          </div>
        </body>
        </html>
      `,
      'works-assigned': `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎖️ Наследники Победы</h1></div>
            <div class="content">
              <h2>Новые работы для оценки</h2>
              <p>Уважаемый(ая) ${data.expertName},</p>
              <p>Вам назначено <strong>${data.worksCount} работ</strong> для проверки и оценки.</p>
              <p>Пожалуйста, войдите в личный кабинет эксперта для ознакомления.</p>
              <a href="${data.dashboardUrl}" class="button">Перейти к работам</a>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Наследники Победы. Севастополь.</div>
          </div>
        </body>
        </html>
      `,
    };

    return templates[templateName] || '';
  }
}
