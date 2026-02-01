import { Injectable } from '@nestjs/common';
import {
  UserRepository,
  CreateUserData,
  UpdateUserData,
  SoftDeleteUserData,
} from '../../../../application/repositories/user.repository';
import { User } from '../../../../application/entities/user.entity';
import { PrismaService } from '../prisma.service';
import { UserPrismaMapper } from '../mappers/user-prisma.mapper';

/**
 * User Prisma Repository
 *
 * Implementación concreta del repositorio de usuarios usando Prisma.
 */
@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return UserPrismaMapper.toDomainList(users);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return user ? UserPrismaMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });

    return user ? UserPrismaMapper.toDomain(user) : null;
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    return user ? UserPrismaMapper.toDomain(user) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        createdBy: data.createdBy,
      },
    });

    return UserPrismaMapper.toDomain(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.password !== undefined) updateData.password = data.password;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return UserPrismaMapper.toDomain(user);
  }

  async softDelete(id: string, data: SoftDeleteUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: data.deletedBy,
        isActive: false,
      },
    });

    return UserPrismaMapper.toDomain(user);
  }

  async restore(id: string, updatedBy?: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        isActive: true,
        updatedBy,
      },
    });

    return UserPrismaMapper.toDomain(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.toLowerCase(),
      },
    });

    return count > 0;
  }
}
