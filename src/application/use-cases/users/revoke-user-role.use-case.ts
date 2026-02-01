import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Revoke Role from User Use Case
 */
@Injectable()
export class RevokeUserRoleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, roleId: string, revokedBy?: string) {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId, roleId },
      },
    });

    if (!userRole) {
      throw new NotFoundException('El usuario no tiene este rol asignado');
    }

    await this.prisma.userRole.update({
      where: {
        userId_roleId: { userId, roleId },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy,
      },
    });

    return { message: 'Rol revocado exitosamente' };
  }
}
