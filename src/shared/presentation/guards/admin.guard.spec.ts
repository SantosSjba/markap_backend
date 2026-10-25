import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { RoleRepository } from '../../../modules/identity/domain/repositories/role.repository';
import { AdminGuard } from './admin.guard';

function context(sub?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: sub ? { sub } : undefined }),
    }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  const findByUserId = jest.fn();
  const guard = new AdminGuard({ findByUserId } as unknown as RoleRepository);

  beforeEach(() => findByUserId.mockReset());

  it('deniega usuarios sin rol administrativo', async () => {
    findByUserId.mockResolvedValue([{ code: 'AGENT' }]);
    await expect(guard.canActivate(context('user'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('permite administradores con rol vigente', async () => {
    findByUserId.mockResolvedValue([{ code: 'ADMIN' }]);
    await expect(guard.canActivate(context('user'))).resolves.toBe(true);
  });

  it('consulta roles de nuevo y aplica revocaciones a sesiones existentes', async () => {
    findByUserId
      .mockResolvedValueOnce([{ code: 'ADMIN' }])
      .mockResolvedValueOnce([]);
    await expect(guard.canActivate(context('user'))).resolves.toBe(true);
    await expect(guard.canActivate(context('user'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deniega solicitudes sin identidad autenticada', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findByUserId).not.toHaveBeenCalled();
  });
});
