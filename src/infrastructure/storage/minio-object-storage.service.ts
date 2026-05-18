import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { EnvConfig } from '../../config';

@Injectable()
export class MinioObjectStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioObjectStorageService.name);
  private client!: S3Client;
  private bucket!: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  onModuleInit(): void {
    const storage = this.config.get('storage', { infer: true });
    this.bucket = storage.bucket;

    const endpoint = storage.endpoint.replace(/\/$/, '');
    this.client = new S3Client({
      region: storage.region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: storage.accessKey,
        secretAccessKey: storage.secretKey,
      },
    });

    void this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket creado: ${this.bucket}`);
      } catch (err) {
        this.logger.warn(
          `No se pudo verificar/crear el bucket "${this.bucket}". Compruebe permisos en MinIO.`,
        );
        this.logger.debug(err);
      }
    }
  }

  getBucket(): string {
    return this.bucket;
  }

  async putObject(
    objectKey: string,
    body: Buffer,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      }),
    );
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  async getPresignedDownloadUrl(
    objectKey: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}
