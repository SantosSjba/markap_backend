import { Injectable } from '@nestjs/common';
import {
  PasswordResetCodeRepository,
  CreatePasswordResetCodeData,
} from '@domain/repositories/password-reset-code.repository';
import { PasswordResetCode } from '@domain/entities/password-reset-code.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PasswordResetCodePrismaRepository implements PasswordResetCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePasswordResetCodeData): Promise<PasswordResetCode> {
    const record = await this.prisma.passwordResetCode.create({
      data: {
        userId: data.userId,
        code: data.code,
        expiresAt: data.expiresAt,
      },
    });

    return this.toDomain(record);
  }

  async findValidByCodeAndUserId(
    code: string,
    userId: string,
  ): Promise<PasswordResetCode | null> {
    const record = await this.prisma.passwordResetCode.findFirst({
      where: {
        code,
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return record ? this.toDomain(record) : null;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.passwordResetCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUserCodes(userId: string): Promise<void> {
    await this.prisma.passwordResetCode.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
  }

  private toDomain(record: {
    id: string;
    userId: string;
    code: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }): PasswordResetCode {
    return new PasswordResetCode(
      record.id,
      record.userId,
      record.code,
      record.expiresAt,
      record.usedAt,
      record.createdAt,
    );
  }
}
