import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  GetMenusByApplicationUseCase,
  GetMenusFlatUseCase,
  CreateMenuUseCase,
  UpdateMenuUseCase,
  DeleteMenuUseCase,
} from '../../../application/use-cases/menus';
import { CreateMenuDto, UpdateMenuDto } from '../dtos/menus';

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
  @ApiOperation({ summary: 'Actualizar menú' })
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.updateMenuUseCase.execute({
      id,
      ...dto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar menú' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string) {
    await this.deleteMenuUseCase.execute(id);
    return { message: 'Menú eliminado' };
  }
}
