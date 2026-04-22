import { Injectable } from '@nestjs/common';
import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';
import { RegisterUserUseCase } from '../use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../use-cases/auth/login-user.use-case';
import { GetUserProfileUseCase } from '../use-cases/auth/get-user-profile.use-case';
import { RequestPasswordResetUseCase } from '../use-cases/auth/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../use-cases/auth/reset-password.use-case';
import { GetUserRolesUseCase } from '../use-cases/roles/get-user-roles.use-case';
import type { RegisterUserInput } from '../use-cases/auth/register-user.use-case';
import type { LoginUserInput, LoginUserOutput } from '../use-cases/auth/login-user.use-case';
import type { RequestPasswordResetInput } from '../use-cases/auth/request-password-reset.use-case';
import type { ResetPasswordInput } from '../use-cases/auth/reset-password.use-case';
import type { AuthPort } from './auth.port';

@Injectable()
export class AuthPortImpl implements AuthPort {
  constructor(
    private readonly registerUc: RegisterUserUseCase,
    private readonly loginUc: LoginUserUseCase,
    private readonly profileUc: GetUserProfileUseCase,
    private readonly userRolesUc: GetUserRolesUseCase,
    private readonly requestResetUc: RequestPasswordResetUseCase,
    private readonly resetPasswordUc: ResetPasswordUseCase,
  ) {}

  register(input: RegisterUserInput): Promise<User> {
    return this.registerUc.execute(input);
  }

  login(input: LoginUserInput): Promise<LoginUserOutput> {
    return this.loginUc.execute(input);
  }

  getRolesForUser(userId: string): Promise<Role[]> {
    return this.userRolesUc.execute(userId);
  }

  async getProfileWithRoles(userId: string): Promise<{ user: User; roles: Role[] }> {
    const user = await this.profileUc.execute(userId);
    const roles = await this.userRolesUc.execute(user.id);
    return { user, roles };
  }

  requestPasswordReset(input: RequestPasswordResetInput): Promise<void> {
    return this.requestResetUc.execute(input);
  }

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return this.resetPasswordUc.execute(input);
  }
}
