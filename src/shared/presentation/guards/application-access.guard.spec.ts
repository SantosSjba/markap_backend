import {
  ExecutionContext,
  Controller,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationAccessGuard } from './application-access.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  RequiresApplication,
  RequiresAccessLevel,
  SkipApplicationAccess,
} from '../decorators/application-access.decorators';
import type { AccessLevel } from '../../domain/access-level';
@RequiresApplication('contabilidad')
class Accounts {
  read() {}
  @RequiresAccessLevel('READ') report() {}
}
@Controller('clients')
@RequiresApplication({ fromRequest: true, fallback: ['alquileres', 'ventas'] })
class Shared {
  read() {}
}
@SkipApplicationAccess()
class Public {
  read() {}
}
class Unknown {
  read() {}
}
describe('ApplicationAccessGuard', () => {
  const resolveResourceApplication = jest.fn();
  const getLevels = jest.fn(),
    record = jest.fn().mockResolvedValue(undefined),
    authenticate = jest.fn();
  const guard = new ApplicationAccessGuard(
    new Reflector(),
    { canActivate: authenticate } as unknown as JwtAuthGuard,
    { getLevels, invalidate: jest.fn(), resolveResourceApplication },
    { record },
  );
  function ctx(
    controller: { prototype: object },
    method = 'GET',
    query = {},
    body = {},
    user: { sub: string } | null = { sub: 'u' },
    handler = 'read',
    params = {},
  ) {
    return {
      getType: () => 'http',
      getClass: () => controller,
      getHandler: () =>
        (controller.prototype as Record<string, unknown>)[handler],
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          params,
          query,
          body,
          user,
          headers: {},
          path: '/test',
        }),
      }),
    } as unknown as ExecutionContext;
  }
  beforeEach(() => {
    jest.clearAllMocks();
    record.mockResolvedValue(undefined);
  });
  function level(value: AccessLevel, slug = 'contabilidad') {
    getLevels.mockResolvedValue(
      new Map([
        [slug, { level: value, name: 'Contabilidad', applicationId: 'app' }],
      ]),
    );
  }
  it.each([
    ['GET', 'READ', true],
    ['POST', 'READ', false],
    ['DELETE', 'WRITE', false],
    ['DELETE', 'ADMIN', true],
  ] as const)('%s con %s', async (method, value, allowed) => {
    level(value);
    if (allowed)
      await expect(guard.canActivate(ctx(Accounts, method))).resolves.toBe(
        true,
      );
    else {
      await expect(
        guard.canActivate(ctx(Accounts, method)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCESS_DENIED',
          outsideTransaction: true,
        }),
      );
    }
  });
  it('permite POST de consulta marcado READ', async () => {
    level('READ');
    await expect(
      guard.canActivate(ctx(Accounts, 'POST', {}, {}, { sub: 'u' }, 'report')),
    ).resolves.toBe(true);
  });
  it('resuelve aplicación explícita, id y catálogo compartido', async () => {
    level('READ', 'ventas');
    for (const [q, b] of [
      [{ applicationSlug: 'ventas' }, {}],
      [{}, { applicationId: 'app' }],
      [{ applicationId: 'app' }, {}],
      [{}, {}],
    ])
      await expect(guard.canActivate(ctx(Shared, 'GET', q, b))).resolves.toBe(
        true,
      );
    await expect(
      guard.canActivate(ctx(Shared, 'GET', { applicationSlug: 'produccion' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('falla cerrado sin decorador y sin fallback autorizado', async () => {
    getLevels.mockResolvedValue(new Map());
    await expect(guard.canActivate(ctx(Unknown))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(guard.canActivate(ctx(Shared))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('omite controladores públicos y exige JWT antes de autorizar negocio', async () => {
    await expect(guard.canActivate(ctx(Public))).resolves.toBe(true);
    expect(getLevels).not.toHaveBeenCalled();
    authenticate.mockRejectedValue(new UnauthorizedException());
    await expect(
      guard.canActivate(ctx(Accounts, 'GET', {}, {}, null)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('no usa el nivel alto de otra aplicación para borrar un recurso compartido', async () => {
    getLevels.mockResolvedValue(
      new Map([
        ['ventas', { level: 'READ', name: 'Ventas', applicationId: 'sales' }],
        [
          'alquileres',
          { level: 'ADMIN', name: 'Alquileres', applicationId: 'rentals' },
        ],
      ]),
    );
    resolveResourceApplication.mockResolvedValue('sales');
    await expect(
      guard.canActivate(
        ctx(Shared, 'DELETE', {}, {}, { sub: 'u' }, 'read', { id: 'client' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(resolveResourceApplication).toHaveBeenCalledWith(
      'clients',
      'client',
    );
  });
});
