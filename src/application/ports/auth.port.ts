import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';
import type { RegisterUserInput } from '../use-cases/auth/register-user.use-case';
import type { LoginUserInput, LoginUserOutput } from '../use-cases/auth/login-user.use-case';
import type { RequestPasswordResetInput } from '../use-cases/auth/request-password-reset.use-case';
import type { ResetPasswordInput } from '../use-cases/auth/reset-password.use-case';

export const AUTH_PORT = Symbol('AuthPort');

export interface AuthPort {
  register(input: RegisterUserInput): Promise<User>;
  login(input: LoginUserInput): Promise<LoginUserOutput>;
  getRolesForUser(userId: string): Promise<Role[]>;
  getProfileWithRoles(userId: string): Promise<{ user: User; roles: Role[] }>;
  requestPasswordReset(input: RequestPasswordResetInput): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
}
