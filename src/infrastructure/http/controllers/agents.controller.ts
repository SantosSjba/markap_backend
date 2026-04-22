import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AGENT_PORT, type AgentPort } from '@application/ports';
import { CreateAgentDto, UpdateAgentDto } from '../dtos/agents';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AgentsController {
  constructor(
    @Inject(AGENT_PORT) private readonly agent: AgentPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar agentes (paginado)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Slug de la aplicación (ej. alquileres, ventas). Por defecto: alquileres',
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
    return this.agent.listAgents({
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
    return this.agent.createAgent({
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
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description:
      'Si se envía, valida que el agente pertenezca a esa aplicación (ej. ventas)',
  })
  @ApiResponse({ status: 200 })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.agent.getAgentById(id, {
      applicationSlug: applicationSlug?.trim() || undefined,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar agente' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, el agente debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200 })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.agent.updateAgent(
      id,
      {
        type: dto.type,
        userId: dto.userId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        documentTypeId: dto.documentTypeId,
        documentNumber: dto.documentNumber,
        isActive: dto.isActive,
      },
      applicationSlug,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar agente (soft delete)' })
  @ApiQuery({
    name: 'applicationSlug',
    required: false,
    description: 'Si se indica, el agente debe pertenecer a esa aplicación',
  })
  @ApiResponse({ status: 200, description: 'Agente eliminado correctamente' })
  @ApiResponse({ status: 404 })
  async remove(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.agent.deleteAgent(id, applicationSlug);
  }
}
