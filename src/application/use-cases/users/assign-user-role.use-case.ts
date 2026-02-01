import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Assign Role to User Use Case
 */
@Injectable()
export class AssignUserRoleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, roleId: string, assignedBy?: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.deletedAt) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Assign role
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId },
      },
      create: {
        userId,
        roleId,
        assignedBy,
        isActive: true,
      },
      update: {
        isActive: true,
        revokedAt: null,
        revokedBy: null,
        assignedBy,
      },
    });

    return { message: 'Rol asignado exitosamente' };
  }
}
