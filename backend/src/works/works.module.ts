import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Храним в памяти, потом загружаем в S3
      limits: {
        fileSize: 15 * 1024 * 1024, // 15 MB
      },
    }),
  ],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}
