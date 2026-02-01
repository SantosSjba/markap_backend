import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Get All Users Use Case
 */
@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          where: { isActive: true, revokedAt: null },
          include: { role: true },
        },
      },
    });
  }
}
