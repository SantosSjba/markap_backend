import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetAllRolesUseCase } from '../../../application/use-cases/roles/get-all-roles.use-case';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly getAllRolesUseCase: GetAllRolesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async getAll() {
    const roles = await this.getAllRolesUseCase.execute();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
    }));
  }
}
