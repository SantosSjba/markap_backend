import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
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
  ) {
    return this.ple.generateBooks(applicationSlug, periodId, body.bookCodes ?? []);
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
