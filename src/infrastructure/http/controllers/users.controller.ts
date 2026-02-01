import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { GetAllUsersUseCase } from '../../../application/use-cases/users/get-all-users.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/users/update-user.use-case';
import { ToggleUserActiveUseCase } from '../../../application/use-cases/users/toggle-user-active.use-case';
import { AssignUserRoleUseCase } from '../../../application/use-cases/users/assign-user-role.use-case';
import { RevokeUserRoleUseCase } from '../../../application/use-cases/users/revoke-user-role.use-case';
import { RegisterUserUseCase } from '../../../application/use-cases/auth';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly toggleUserActiveUseCase: ToggleUserActiveUseCase,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase,
    private readonly revokeUserRoleUseCase: RevokeUserRoleUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getAll() {
    const users = await this.getAllUsersUseCase.execute();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: { email: string; password: string; firstName: string; lastName: string },
  ) {
    const user = await this.registerUserUseCase.execute({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      createdBy: req.user.sub,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: [],
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { firstName?: string; lastName?: string; email?: string },
  ) {
    const user = await this.updateUserUseCase.execute({
      userId: id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      updatedBy: req.user.sub,
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
    };
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Activar/Desactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = await this.toggleUserActiveUseCase.execute(id, req.user.sub);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })),
    };
  }

  @Post(':userId/roles/:roleId')
  @ApiOperation({ summary: 'Asignar rol a usuario' })
  @ApiResponse({ status: 200, description: 'Rol asignado' })
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.assignUserRoleUseCase.execute(userId, roleId, req.user.sub);
  }

  @Delete(':userId/roles/:roleId')
  @ApiOperation({ summary: 'Revocar rol de usuario' })
  @ApiResponse({ status: 200, description: 'Rol revocado' })
  async revokeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.revokeUserRoleUseCase.execute(userId, roleId, req.user.sub);
  }
}
