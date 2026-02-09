import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  AssignApplicationToRoleUseCase,
  RevokeApplicationFromRoleUseCase,
} from '../../../application/use-cases/roles';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/roles';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly assignApplicationToRoleUseCase: AssignApplicationToRoleUseCase,
    private readonly revokeApplicationFromRoleUseCase: RevokeApplicationFromRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async getAll() {
    const roles = await this.getAllRolesUseCase.execute();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getById(@Param('id') id: string) {
    const role = await this.getRoleByIdUseCase.execute(id);
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'El código de rol ya existe' })
  async create(@Body() dto: CreateRoleDto) {
    return this.createRoleUseCase.execute({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      isActive: dto.isActive,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.updateRoleUseCase.execute({
      id,
      ...dto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rol (soft delete)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async delete(@Param('id') id: string) {
    await this.deleteRoleUseCase.execute(id);
    return { message: 'Rol eliminado' };
  }

  @Post(':roleId/applications/:applicationId')
  @ApiOperation({ summary: 'Asignar aplicación a rol' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Rol o aplicación no encontrada' })
  async assignApplication(
    @Param('roleId') roleId: string,
    @Param('applicationId') applicationId: string,
  ) {
    await this.assignApplicationToRoleUseCase.execute({
      roleId,
      applicationId,
    });
    return { message: 'Aplicación asignada al rol' };
  }

  @Delete(':roleId/applications/:applicationId')
  @ApiOperation({ summary: 'Revocar aplicación del rol' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async revokeApplication(
    @Param('roleId') roleId: string,
    @Param('applicationId') applicationId: string,
  ) {
    await this.revokeApplicationFromRoleUseCase.execute({
      roleId,
      applicationId,
    });
    return { message: 'Aplicación revocada del rol' };
  }
}
