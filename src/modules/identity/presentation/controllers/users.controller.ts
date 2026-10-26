import { SkipApplicationAccess } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../../../../shared/presentation/guards/admin.guard';
import type { AuthenticatedRequest } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { AUTH_PORT, type AuthPort } from '../../application/ports/auth.port';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { AssignUserRoleUseCase } from '../../application/use-cases/users/assign-user-role.use-case';
import { GetAllUsersUseCase } from '../../application/use-cases/users/get-all-users.use-case';
import { RevokeUserRoleUseCase } from '../../application/use-cases/users/revoke-user-role.use-case';
import { ToggleUserActiveUseCase } from '../../application/use-cases/users/toggle-user-active.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { CreateUserDto } from '../dtos/users/create-user.dto';
import { UpdateUserDto } from '../dtos/users/update-user.dto';
import { UserHttpMapper } from '../mappers/user-http.mapper';

@ApiTags('Users')
@SkipApplicationAccess()
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    @Inject(AUTH_PORT) private readonly auth: AuthPort,
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
    return users.map((user) => UserHttpMapper.toResponseFromListItem(user));
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      createdBy: req.user.sub,
    });

    for (const roleId of dto.roleIds ?? []) {
      await this.assignUserRoleUseCase.execute(user.id, roleId, req.user.sub);
    }

    const profile = await this.auth.getProfileWithRoles(user.id);
    return UserHttpMapper.toResponseWithRoleEntities(
      profile.user,
      profile.roles,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario con sus roles actuales' })
  async getById(@Param('id') id: string) {
    const profile = await this.auth.getProfileWithRoles(id);
    return UserHttpMapper.toResponseWithRoleEntities(
      profile.user,
      profile.roles,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: UpdateUserDto,
  ) {
    const user = await this.updateUserUseCase.execute({
      userId: id,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      updatedBy: req.user.sub,
    });

    return UserHttpMapper.toResponseFromListItem(user);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Activar/Desactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const user = await this.toggleUserActiveUseCase.execute(id, req.user.sub);

    return UserHttpMapper.toResponseFromListItem(user);
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
