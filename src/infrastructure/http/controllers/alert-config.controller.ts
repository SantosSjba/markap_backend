import {
  Controller,
  Get,
  Put,
  Body,
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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { GetAlertConfigUseCase } from '../../../application/use-cases/alert-config/get-alert-config.use-case';
import { UpsertAlertConfigUseCase } from '../../../application/use-cases/alert-config/upsert-alert-config.use-case';
import { UpsertAlertConfigDto } from '../dtos/alert-config/upsert-alert-config.dto';

@ApiTags('Alert Config')
@Controller('alert-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AlertConfigController {
  constructor(
    private readonly getAlertConfig: GetAlertConfigUseCase,
    private readonly upsertAlertConfig: UpsertAlertConfigUseCase,
  ) {}

  @Get(':applicationSlug')
  @ApiOperation({ summary: 'Obtener configuración de alertas del usuario para una aplicación' })
  @ApiResponse({ status: 200 })
  async get(
    @Request() req: AuthenticatedRequest,
    @Param('applicationSlug') applicationSlug: string,
  ) {
    return this.getAlertConfig.execute(req.user.sub, applicationSlug);
  }

  @Put(':applicationSlug')
  @ApiOperation({ summary: 'Guardar/actualizar configuración de alertas del usuario' })
  @ApiResponse({ status: 200 })
  async upsert(
    @Request() req: AuthenticatedRequest,
    @Param('applicationSlug') applicationSlug: string,
    @Body() dto: UpsertAlertConfigDto,
  ) {
    return this.upsertAlertConfig.execute({
      userId: req.user.sub,
      applicationSlug,
      ...dto,
    });
  }
}
