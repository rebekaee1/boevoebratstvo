import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * Сервис для работы с Timeweb Object Storage (S3-совместимое)
 */
@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'nasledniki-pobedy');

    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: 'ru-1', // Timeweb использует ru-1
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', ''),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', ''),
      },
      forcePathStyle: true, // Для совместимости с MinIO/Timeweb
    });
  }

  /**
   * Загрузка файла в хранилище
   * @param file - буфер файла
   * @param originalName - оригинальное имя файла
   * @param mimeType - MIME-тип
   * @returns ключ файла в хранилище
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; size: number }> {
    try {
      // Генерируем уникальный ключ
      const ext = originalName.split('.').pop() || '';
      const key = `works/${uuidv4()}.${ext}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
          ContentDisposition: `inline; filename="${encodeURIComponent(originalName)}"`,
        }),
      );

      return { key, size: file.length };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new InternalServerErrorException('Ошибка загрузки файла');
    }
  }

  /**
   * Получение presigned URL для скачивания файла
   * @param key - ключ файла в хранилище
   * @param expiresIn - время жизни ссылки в секундах (по умолчанию 1 час)
   */
  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 GetSignedUrl Error:', error);
      throw new InternalServerErrorException('Ошибка получения ссылки на файл');
    }
  }

  /**
   * Удаление файла из хранилища
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('S3 Delete Error:', error);
      // Не выбрасываем ошибку - файла может не быть
    }
  }

  /**
   * Получение файла как Buffer (для прямой отдачи)
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      // Конвертируем stream в Buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('S3 GetFile Error:', error);
      throw new InternalServerErrorException('Ошибка получения файла');
    }
  }
}
