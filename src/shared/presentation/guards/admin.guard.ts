import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { RoleRepository } from '../../../modules/identity/domain/repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../modules/identity/domain/repositories/role.repository';
import type { AuthenticatedRequest } from './jwt-auth.guard';

/** Comprueba roles actuales de BD, incluidos revocaciones y roles desactivados. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>()
      .user?.sub;
    if (userId) {
      const roles = await this.roles.findByUserId(userId);
      if (roles.some((role) => role.code === 'ADMIN')) return true;
    }
    throw new ForbiddenException('Esta operación requiere un administrador.');
  }
}
