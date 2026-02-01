import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Toggle User Active Status Use Case
 */
@Injectable()
export class ToggleUserActiveUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, updatedBy?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
        updatedBy,
      },
      include: {
        userRoles: {
          where: { isActive: true, revokedAt: null },
          include: { role: true },
        },
      },
    });
  }
}
