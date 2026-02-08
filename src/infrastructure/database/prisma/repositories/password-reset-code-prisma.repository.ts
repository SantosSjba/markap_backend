import { Injectable } from '@nestjs/common';
import {
  PasswordResetCodeRepository,
  PasswordResetCodeData,
  CreatePasswordResetCodeData,
} from '../../../../application/repositories/password-reset-code.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PasswordResetCodePrismaRepository
  implements PasswordResetCodeRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePasswordResetCodeData): Promise<PasswordResetCodeData> {
    const record = await this.prisma.passwordResetCode.create({
      data: {
        userId: data.userId,
        code: data.code,
        expiresAt: data.expiresAt,
      },
    });

    return this.toData(record);
  }

  async findValidByCodeAndUserId(
    code: string,
    userId: string
  ): Promise<PasswordResetCodeData | null> {
    const record = await this.prisma.passwordResetCode.findFirst({
      where: {
        code,
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return record ? this.toData(record) : null;
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

  private toData(record: {
    id: string;
    userId: string;
    code: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }): PasswordResetCodeData {
    return {
      id: record.id,
      userId: record.userId,
      code: record.code,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    };
  }
}
