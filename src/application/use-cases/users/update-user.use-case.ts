import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  updatedBy?: string;
}

/**
 * Update User Use Case
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: UpdateUserInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.user.update({
      where: { id: input.userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        updatedBy: input.updatedBy,
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
