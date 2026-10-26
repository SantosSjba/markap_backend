import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import {
  AUDIT_RECORDER,
  type AuditRecorder,
} from '../../application/ports/audit-recorder.port';
import type { RoleRepository } from '../../../modules/identity/domain/repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../modules/identity/domain/repositories/role.repository';
import type { AuthenticatedRequest } from './jwt-auth.guard';

/** Comprueba roles actuales de BD, incluidos revocaciones y roles desactivados. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Optional() @Inject(AUDIT_RECORDER) private readonly audit?: AuditRecorder,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>()
      .user?.sub;
    if (userId) {
      const roles = await this.roles.findByUserId(userId);
      if (roles.some((role) => role.code === 'ADMIN')) return true;
    }
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    await this.audit?.record({
      action: 'ACCESS_DENIED',
      userId: userId ?? null,
      outsideTransaction: true,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
      requestId: typeof req.id === 'string' ? req.id : null,
      metadata: { method: req.method, path: req.path, required: 'ADMIN_ROLE' },
    });
    throw new ForbiddenException('Esta operación requiere un administrador.');
  }
}
