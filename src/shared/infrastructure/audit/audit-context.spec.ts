import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { AuditContext, type AuditContextData } from './audit-context';
import { AuditContextInterceptor } from './audit-context.interceptor';

describe('AuditContext', () => {
  it('get() fuera de contexto devuelve SYSTEM_CONTEXT', () => {
    const data = AuditContext.get();
    expect(data.userId).toBeNull();
    expect(data.source).toBe('SYSTEM');
  });

  it('run() expone los datos dentro de fn, también tras un await', async () => {
    const data: AuditContextData = {
      userId: 'u1',
      requestId: 'r1',
      ip: '1.1.1.1',
      userAgent: 'ua',
      source: 'HTTP',
    };
    const seen = await AuditContext.run(data, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return AuditContext.get();
    });
    expect(seen).toEqual(data);
    expect(AuditContext.get().source).toBe('SYSTEM');
  });
});

describe('AuditContextInterceptor', () => {
  const interceptor = new AuditContextInterceptor();
  const handler = (): CallHandler => ({
    handle: () =>
      new Observable<AuditContextData>((sub) => {
        sub.next(AuditContext.get());
        sub.complete();
      }),
  });

  it('toma userId de req.user.sub, ip de req.ip, userAgent del header y requestId de req.id', async () => {
    const req = {
      user: { sub: 'user-9' },
      ip: '10.0.0.5',
      id: 'req-42',
      headers: { 'user-agent': 'jest-agent' },
    };
    const ctx = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
    const result = (await lastValueFrom(
      interceptor.intercept(ctx, handler()),
    )) as AuditContextData;
    expect(result).toEqual({
      userId: 'user-9',
      requestId: 'req-42',
      ip: '10.0.0.5',
      userAgent: 'jest-agent',
      source: 'HTTP',
    });
  });

  it('usa source WS y client.data.user.sub fuera de HTTP', async () => {
    const ctx = {
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => ({ data: { user: { sub: 'ws-user' } } }),
      }),
    } as unknown as ExecutionContext;
    const result = (await lastValueFrom(
      interceptor.intercept(ctx, handler()),
    )) as AuditContextData;
    expect(result.source).toBe('WS');
    expect(result.userId).toBe('ws-user');
  });
});
