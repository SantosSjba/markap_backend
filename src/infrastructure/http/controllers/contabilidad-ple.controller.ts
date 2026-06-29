import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadPleOperationsService } from '../../../application/services/contabilidad-ple-operations.service';

@ApiTags('Contabilidad — PLE / Libros electrónicos')
@Controller('contabilidad-ple')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadPleController {
  constructor(private readonly ple: ContabilidadPleOperationsService) {}

  @Get('books')
  @ApiOperation({ summary: 'Catálogo de libros PLE disponibles' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listBooks(@Query('applicationSlug') applicationSlug?: string) {
    return this.ple.listBooks(applicationSlug);
  }

  @Get('mandatory-profile')
  @ApiOperation({ summary: 'Libros obligatorios según régimen tributario de la empresa' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getMandatoryProfile(@Query('applicationSlug') applicationSlug?: string) {
    return this.ple.getMandatoryProfile(applicationSlug);
  }

  @Get('export-logs')
  @ApiOperation({ summary: 'Historial de exportaciones PLE' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listExportLogs(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.ple.listExportLogs(applicationSlug, periodId, parsedLimit);
  }

  @Get('consulta/libro-mayor')
  @ApiOperation({ summary: 'Consulta libro mayor (movimientos por cuenta)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getLibroMayor(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.ple.getLibroMayor(applicationSlug, periodId, accountId);
  }

  @Post(':periodId/generate')
  @ApiOperation({ summary: 'Generar uno o más libros PLE con validación previa' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  generateBooks(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
    @Body() body: { bookCodes: string[] },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ple.generateBooks(applicationSlug, periodId, body.bookCodes ?? [], req.user?.sub);
  }

  @Post(':periodId/download-zip')
  @ApiOperation({ summary: 'Generar y descargar ZIP con todos los libros del periodo' })
  @ApiProduces('application/zip')
  @ApiQuery({ name: 'applicationSlug', required: false })
  async downloadZip(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
    @Body() body: { bookCodes: string[] },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.ple.downloadZip(
      applicationSlug,
      periodId,
      body.bookCodes ?? [],
      req.user?.sub,
    );
    res
      .setHeader('Content-Type', 'application/zip')
      .setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      .send(buffer);
  }

  @Get(':periodId/:bookCode/download')
  @ApiOperation({ summary: 'Descargar archivo PLE como texto plano' })
  @ApiProduces('text/plain')
  @ApiQuery({ name: 'applicationSlug', required: false })
  async downloadBook(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
    @Param('bookCode') bookCode: string,
    @Res() res: Response,
  ) {
    const file = await this.ple.generateBook(applicationSlug, periodId, bookCode);
    res
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
      .send(file.content);
  }

  @Get(':periodId/:bookCode')
  @ApiOperation({ summary: 'Generar un libro PLE (JSON con contenido pipe)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  generateBook(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('periodId') periodId: string,
    @Param('bookCode') bookCode: string,
  ) {
    return this.ple.generateBook(applicationSlug, periodId, bookCode);
  }
}
