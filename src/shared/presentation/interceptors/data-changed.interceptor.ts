import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { tap } from 'rxjs';
import { NotificationsGateway } from '../../../modules/notifications/presentation/gateways/notifications.gateway';

/** Avisa después de escrituras exitosas; nunca publica registros ni datos personales. */
@Injectable()
export class DataChangedInterceptor implements NestInterceptor {
  constructor(private readonly gateway: NotificationsGateway) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { sub: string } }>();
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    if (!isWrite || !request.user) return next.handle();
    const resource = request.path.replace(/^\/api\//, '').split('/')[0];
    return next
      .handle()
      .pipe(tap(() => this.gateway.emitDataChanged(resource)));
  }
}
