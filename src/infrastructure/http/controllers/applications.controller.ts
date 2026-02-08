import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUserApplicationsUseCase } from '../../../application/use-cases/applications';
import { GetMenusByApplicationUseCase } from '../../../application/use-cases/menus';
import { ApplicationResponseDto } from '../dtos/applications';
import { ApplicationHttpMapper } from '../mappers/application-http.mapper';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationsController {
  constructor(
    private readonly getUserApplicationsUseCase: GetUserApplicationsUseCase,
    private readonly getMenusByApplicationUseCase: GetMenusByApplicationUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener aplicaciones del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de aplicaciones del usuario',
    type: [ApplicationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getMyApplications(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApplicationResponseDto[]> {
    const applications = await this.getUserApplicationsUseCase.execute(
      req.user.sub,
    );
    return ApplicationHttpMapper.toResponseList(applications);
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
}
