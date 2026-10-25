import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateApplicationUseCase } from '../../application/use-cases/applications/create-application.use-case';
import { DeleteApplicationUseCase } from '../../application/use-cases/applications/delete-application.use-case';
import { GetAllApplicationsUseCase } from '../../application/use-cases/applications/get-all-applications.use-case';
import { GetApplicationByIdUseCase } from '../../application/use-cases/applications/get-application-by-id.use-case';
import { GetUserApplicationsUseCase } from '../../application/use-cases/applications/get-user-applications.use-case';
import { UpdateApplicationUseCase } from '../../application/use-cases/applications/update-application.use-case';
import { GetMenusByApplicationUseCase } from '../../application/use-cases/menus/get-menus-by-application.use-case';
import { ApplicationResponseDto } from '../dtos/applications/application-response.dto';
import { CreateApplicationDto } from '../dtos/applications/create-application.dto';
import { UpdateApplicationDto } from '../dtos/applications/update-application.dto';
import { ApplicationHttpMapper } from '../mappers/application-http.mapper';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationsController {
  constructor(
    private readonly getUserApplicationsUseCase: GetUserApplicationsUseCase,
    private readonly getAllApplicationsUseCase: GetAllApplicationsUseCase,
    private readonly getApplicationByIdUseCase: GetApplicationByIdUseCase,
    private readonly createApplicationUseCase: CreateApplicationUseCase,
    private readonly updateApplicationUseCase: UpdateApplicationUseCase,
    private readonly deleteApplicationUseCase: DeleteApplicationUseCase,
    private readonly getMenusByApplicationUseCase: GetMenusByApplicationUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener aplicaciones del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de aplicaciones del usuario',
    type: [ApplicationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getMyApplications(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApplicationResponseDto[]> {
    const applications = await this.getUserApplicationsUseCase.execute(
      req.user.sub,
    );
    return ApplicationHttpMapper.toResponseList(applications);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las aplicaciones (admin)' })
  @ApiResponse({ status: 200 })
  async getAll() {
    const applications = await this.getAllApplicationsUseCase.execute();
    return ApplicationHttpMapper.toResponseList(applications);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener aplicación por ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Aplicación no encontrada' })
  async getById(@Param('id') id: string) {
    const app = await this.getApplicationByIdUseCase.execute(id);
    return ApplicationHttpMapper.toResponse(app);
  }

  @Get(':slug/menus')
  @ApiOperation({ summary: 'Obtener menús de una aplicación por slug' })
  @ApiResponse({
    status: 200,
    description: 'Menús jerárquicos de la aplicación',
  })
  @ApiResponse({ status: 404, description: 'Aplicación no encontrada' })
  async getMenus(@Param('slug') slug: string) {
    return this.getMenusByApplicationUseCase.execute({
      applicationSlug: slug,
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Crear aplicación' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  async create(@Body() dto: CreateApplicationDto) {
    const app = await this.createApplicationUseCase.execute({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      url: dto.url,
      activeCount: dto.activeCount,
      pendingCount: dto.pendingCount,
      isActive: dto.isActive,
      order: dto.order,
    });
    return ApplicationHttpMapper.toResponse(app);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Actualizar aplicación' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Aplicación no encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    const app = await this.updateApplicationUseCase.execute({
      id,
      ...dto,
    });
    return ApplicationHttpMapper.toResponse(app);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Eliminar aplicación (soft delete)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Aplicación no encontrada' })
  async delete(@Param('id') id: string) {
    await this.deleteApplicationUseCase.execute(id);
    return { message: 'Aplicación eliminada' };
  }
}
