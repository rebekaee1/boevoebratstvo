import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS для фронтенда
  // Поддержка кириллических доменов через Punycode
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const url = new URL(frontendUrl);
    frontendUrl = url.origin; // URL API автоматически конвертирует IDN в Punycode
  } catch {
    // Оставляем как есть если не валидный URL
  }
  
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Глобальный префикс API
  app.setGlobalPrefix('api');

  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет поля, не описанные в DTO
      forbidNonWhitelisted: true, // Ошибка при лишних полях
      transform: true, // Автоматическое преобразование типов
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Наследники Победы API')
    .setDescription(
      'API платформы для конкурса творческих работ школьников. ' +
      'Севастопольское отделение «Боевого Братства».',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Введите JWT токен',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Аутентификация и авторизация')
    .addTag('users', 'Управление пользователями')
    .addTag('works', 'Конкурсные работы')
    .addTag('ratings', 'Оценки работ')
    .addTag('admin', 'Административные функции')
    .addTag('settings', 'Настройки системы')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Наследники Победы - API Docs',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #d4a017; }
    `,
  });

  // Запуск сервера
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏆 Наследники Победы - Backend API                       ║
║                                                            ║
║   🌐 API:      http://localhost:${port}/api                    ║
║   📚 Swagger:  http://localhost:${port}/api/docs               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
