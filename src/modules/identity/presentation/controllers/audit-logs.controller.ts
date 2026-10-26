import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SkipApplicationAccess } from '../../../../shared/presentation/decorators/application-access.decorators';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { AdminGuard } from '../../../../shared/presentation/guards/admin.guard';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.use-case';
import { ListAuditLogsQuery } from '../dtos/audit/list-audit-logs.query';
@SkipApplicationAccess()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AuditLogsController {
  constructor(private readonly logs: ListAuditLogsUseCase) {}
  @Get() list(@Query() query: ListAuditLogsQuery) {
    return this.logs.execute(query);
  }
  @Get(':id') get(@Param('id') id: string) {
    return this.logs.get(id);
  }
}
