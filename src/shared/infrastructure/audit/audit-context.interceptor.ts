import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { AuditContext, type AuditContextData } from './audit-context';

type AuthedRequest = Request & {
  user?: { sub?: string };
  id?: string | number;
};

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const data = this.buildData(context);
    return new Observable((sub) =>
      AuditContext.run(data, () => next.handle().subscribe(sub)),
    );
  }

  private buildData(context: ExecutionContext): AuditContextData {
    if (context.getType() !== 'http') {
      const client = context.switchToWs().getClient<{
        data?: { user?: { sub?: string } };
      }>();
      return {
        userId: client?.data?.user?.sub ?? null,
        requestId: null,
        ip: null,
        userAgent: null,
        source: 'WS',
      };
    }
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const userAgent = req.headers?.['user-agent'];
    return {
      userId: req.user?.sub ?? null,
      requestId: req.id != null ? String(req.id) : null,
      ip: req.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
      source: 'HTTP',
    };
  }
}
