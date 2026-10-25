import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../../../../shared/presentation/guards/admin.guard';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { AssignApplicationToRoleUseCase } from '../../application/use-cases/roles/assign-application-to-role.use-case';
import { CreateRoleUseCase } from '../../application/use-cases/roles/create-role.use-case';
import { DeleteRoleUseCase } from '../../application/use-cases/roles/delete-role.use-case';
import { GetAllRolesUseCase } from '../../application/use-cases/roles/get-all-roles.use-case';
import { GetApplicationsByRoleUseCase } from '../../application/use-cases/roles/get-applications-by-role.use-case';
import { GetRoleByIdUseCase } from '../../application/use-cases/roles/get-role-by-id.use-case';
import { RevokeApplicationFromRoleUseCase } from '../../application/use-cases/roles/revoke-application-from-role.use-case';
import { UpdateRoleUseCase } from '../../application/use-cases/roles/update-role.use-case';
import { ApplicationResponseDto } from '../dtos/applications/application-response.dto';
import { CreateRoleDto } from '../dtos/roles/create-role.dto';
import { UpdateRoleDto } from '../dtos/roles/update-role.dto';
import { ApplicationHttpMapper } from '../mappers/application-http.mapper';
import { RoleHttpMapper } from '../mappers/role-http.mapper';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, AdminGuard)
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
    private readonly getApplicationsByRoleUseCase: GetApplicationsByRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async getAll() {
    const roles = await this.getAllRolesUseCase.execute();
    return roles.map((role) => RoleHttpMapper.toListItem(role));
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Obtener aplicaciones asignadas a un rol' })
  @ApiResponse({
    status: 200,
    description: 'Lista de aplicaciones del rol',
    type: [ApplicationResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getRoleApplications(@Param('id') id: string) {
    const applications = await this.getApplicationsByRoleUseCase.execute(id);
    return ApplicationHttpMapper.toResponseList(applications);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getById(@Param('id') id: string) {
    const role = await this.getRoleByIdUseCase.execute(id);
    return RoleHttpMapper.toDetail(role);
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
