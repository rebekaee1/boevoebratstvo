import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorksModule } from './works/works.module';
import { RatingsModule } from './ratings/ratings.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Конфигурация из .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate Limiting (защита от brute-force)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 секунда
        limit: 3,  // 3 запроса в секунду
      },
      {
        name: 'medium',
        ttl: 10000, // 10 секунд
        limit: 20,  // 20 запросов за 10 секунд
      },
      {
        name: 'long',
        ttl: 60000, // 1 минута
        limit: 100, // 100 запросов в минуту
      },
    ]),
    
    // База данных
    PrismaModule,
    
    // Хранилище файлов (S3)
    StorageModule,
    
    // Аутентификация
    AuthModule,
    
    // Пользователи
    UsersModule,
    
    // Работы
    WorksModule,
    
    // Оценки
    RatingsModule,
    
    // Администрирование
    AdminModule,
    
    // Настройки
    SettingsModule,
    
    // Email уведомления
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Глобальный Rate Limiter Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Глобальный JWT Guard (защита всех роутов по умолчанию)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Глобальный Roles Guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
