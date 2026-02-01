import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Get All Roles Use Case
 */
@Injectable()
export class GetAllRolesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.role.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}
