import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Healthcheck para Coolify / load balancer' })
  @ApiOkResponse({ description: 'API operativa' })
  check() {
    return {
      status: 'ok',
      service: 'markap-api',
      timestamp: new Date().toISOString(),
    };
  }
}
