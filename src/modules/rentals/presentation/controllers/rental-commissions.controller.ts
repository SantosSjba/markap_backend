import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { ListRentalCommissionsUseCase } from '../../application/use-cases/commissions/list-rental-commissions.use-case';
import { UpdateRentalCommissionUseCase } from '../../application/use-cases/commissions/update-rental-commission.use-case';
import { UpdateRentalCommissionDto } from '../dtos/rentals/update-rental-commission.dto';

/** Seguimiento del cobro de comisiones (distinto de Cobranzas: cuotas mensuales del inquilino). */
@ApiTags('Rental commissions')
@RequiresApplication('alquileres')
@Controller('rental-commissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RentalCommissionsController {
  constructor(
    private readonly listUc: ListRentalCommissionsUseCase,
    private readonly updateUc: UpdateRentalCommissionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Comisiones de alquileres y su estado de cobro' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID'] })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Código, propiedad, propietario o inquilino',
  })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      status: status === 'PENDING' || status === 'PAID' ? status : undefined,
      search: search?.trim() || undefined,
    });
  }

  @Patch(':rentalId')
  @ApiOperation({
    summary:
      'Registrar el cobro de la comisión (pagada con fecha real), volverla a pendiente o cambiar la fecha estimada',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(
    @Param('rentalId') rentalId: string,
    @Body() dto: UpdateRentalCommissionDto,
  ) {
    return this.updateUc.execute(rentalId, {
      status: dto.status,
      dueDate: dto.dueDate,
      paidDate: dto.paidDate,
    });
  }
}
