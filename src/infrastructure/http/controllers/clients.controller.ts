import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateClientUseCase } from '../../../application/use-cases/clients';
import { CreateClientDto } from '../dtos/clients';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateClientDto) {
    return this.createClientUseCase.execute({
      applicationId: dto.applicationId,
      applicationSlug: dto.applicationSlug ?? 'alquileres',
      clientType: dto.clientType,
      documentTypeId: dto.documentTypeId,
      documentNumber: dto.documentNumber,
      fullName: dto.fullName,
      legalRepresentativeName: dto.legalRepresentativeName,
      legalRepresentativePosition: dto.legalRepresentativePosition,
      primaryPhone: dto.primaryPhone,
      secondaryPhone: dto.secondaryPhone,
      primaryEmail: dto.primaryEmail,
      secondaryEmail: dto.secondaryEmail,
      notes: dto.notes,
      address: dto.address,
    });
  }

  @Get('document-types')
  @ApiOperation({ summary: 'Listar tipos de documento' })
  @ApiResponse({ status: 200 })
  async getDocumentTypes() {
    return this.prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('districts')
  @ApiOperation({ summary: 'Listar distritos (con provincia y departamento)' })
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiResponse({ status: 200 })
  async getDistricts(@Query('provinceId') provinceId?: string) {
    const where = provinceId ? { provinceId } : {};
    return this.prisma.district.findMany({
      where,
      include: {
        province: {
          include: { department: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
