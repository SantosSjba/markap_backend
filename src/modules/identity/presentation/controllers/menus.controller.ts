import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../../../../shared/presentation/guards/admin.guard';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { CreateMenuUseCase } from '../../application/use-cases/menus/create-menu.use-case';
import { DeleteMenuUseCase } from '../../application/use-cases/menus/delete-menu.use-case';
import { GetMenusByApplicationUseCase } from '../../application/use-cases/menus/get-menus-by-application.use-case';
import { GetMenusFlatUseCase } from '../../application/use-cases/menus/get-menus-flat.use-case';
import { UpdateMenuUseCase } from '../../application/use-cases/menus/update-menu.use-case';
import { CreateMenuDto } from '../dtos/menus/create-menu.dto';
import { UpdateMenuDto } from '../dtos/menus/update-menu.dto';

@ApiTags('Menus')
@Controller('menus')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MenusController {
  constructor(
    private readonly getMenusByApplicationUseCase: GetMenusByApplicationUseCase,
    private readonly getMenusFlatUseCase: GetMenusFlatUseCase,
    private readonly createMenuUseCase: CreateMenuUseCase,
    private readonly updateMenuUseCase: UpdateMenuUseCase,
    private readonly deleteMenuUseCase: DeleteMenuUseCase,
  ) {}

  @Get('application/:slug')
  @ApiOperation({ summary: 'Obtener menús de aplicación (árbol)' })
  async getByApplication(@Param('slug') slug: string) {
    return this.getMenusByApplicationUseCase.execute({
      applicationSlug: slug,
    });
  }

  @Get('application/:slug/flat')
  @ApiOperation({ summary: 'Obtener menús de aplicación (lista plana)' })
  async getFlatByApplication(@Param('slug') slug: string) {
    return this.getMenusFlatUseCase.execute({
      applicationSlug: slug,
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Crear menú' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateMenuDto) {
    return this.createMenuUseCase.execute({
      applicationId: dto.applicationId,
      parentId: dto.parentId,
      label: dto.label,
      icon: dto.icon,
      path: dto.path,
      order: dto.order,
    });
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Actualizar menú' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.updateMenuUseCase.execute({
      id,
      ...dto,
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Eliminar menú' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string) {
    await this.deleteMenuUseCase.execute(id);
    return { message: 'Menú eliminado' };
  }
}
