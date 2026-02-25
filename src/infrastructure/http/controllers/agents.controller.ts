import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateAgentUseCase,
  ListAgentsUseCase,
  GetAgentByIdUseCase,
  UpdateAgentUseCase,
} from '../../../application/use-cases/agents';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agents';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AgentsController {
  constructor(
    private readonly createAgentUseCase: CreateAgentUseCase,
    private readonly listAgentsUseCase: ListAgentsUseCase,
    private readonly getAgentByIdUseCase: GetAgentByIdUseCase,
    private readonly updateAgentUseCase: UpdateAgentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar agentes (paginado)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Slug de la aplicación (default: alquileres)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, email, teléfono' })
  @ApiQuery({ name: 'type', required: false, enum: ['INTERNAL', 'EXTERNAL'] })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por activos (true/false)' })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: 'INTERNAL' | 'EXTERNAL',
    @Query('isActive') isActive?: string,
  ) {
    return this.listAgentsUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      type,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear agente' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateAgentDto) {
    return this.createAgentUseCase.execute({
      applicationId: dto.applicationId,
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      type: dto.type,
      userId: dto.userId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      documentTypeId: dto.documentTypeId,
      documentNumber: dto.documentNumber,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener agente por ID' })
  @ApiResponse({ status: 200 })
  async getById(@Param('id') id: string) {
    return this.getAgentByIdUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar agente' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.updateAgentUseCase.execute(id, {
      type: dto.type,
      userId: dto.userId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      documentTypeId: dto.documentTypeId,
      documentNumber: dto.documentNumber,
      isActive: dto.isActive,
    });
  }
}
