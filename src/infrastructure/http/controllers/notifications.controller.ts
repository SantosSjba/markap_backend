import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { NotificationsService } from '../services/notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200 })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.sub;
    return this.notificationsService.listByUserId(
      userId,
      unreadOnly === 'true',
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leídas' })
  @ApiResponse({ status: 200 })
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.countUnread(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async markAsRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }
}
