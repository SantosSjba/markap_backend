import { Module } from '@nestjs/common';
import { RuntimeModule } from '../../composition/runtime.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { AuthRateLimitModule } from '../../shared/infrastructure/security/auth-rate-limit.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { AuthFacade } from './application/facades/auth.facade';
import { AUTH_PORT } from './application/ports/auth.port';
import { CreateApplicationUseCase } from './application/use-cases/applications/create-application.use-case';
import { DeleteApplicationUseCase } from './application/use-cases/applications/delete-application.use-case';
import { GetAllApplicationsUseCase } from './application/use-cases/applications/get-all-applications.use-case';
import { GetApplicationByIdUseCase } from './application/use-cases/applications/get-application-by-id.use-case';
import { GetUserApplicationsUseCase } from './application/use-cases/applications/get-user-applications.use-case';
import { UpdateApplicationUseCase } from './application/use-cases/applications/update-application.use-case';
import { GetUserProfileUseCase } from './application/use-cases/auth/get-user-profile.use-case';
import { LoginUserUseCase } from './application/use-cases/auth/login-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/auth/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/auth/reset-password.use-case';
import { AssignApplicationToRoleUseCase } from './application/use-cases/roles/assign-application-to-role.use-case';
import { CreateRoleUseCase } from './application/use-cases/roles/create-role.use-case';
import { DeleteRoleUseCase } from './application/use-cases/roles/delete-role.use-case';
import { GetAllRolesUseCase } from './application/use-cases/roles/get-all-roles.use-case';
import { GetApplicationsByRoleUseCase } from './application/use-cases/roles/get-applications-by-role.use-case';
import { GetRoleByIdUseCase } from './application/use-cases/roles/get-role-by-id.use-case';
import { GetUserRolesUseCase } from './application/use-cases/roles/get-user-roles.use-case';
import { RevokeApplicationFromRoleUseCase } from './application/use-cases/roles/revoke-application-from-role.use-case';
import { UpdateRoleUseCase } from './application/use-cases/roles/update-role.use-case';
import { AssignUserRoleUseCase } from './application/use-cases/users/assign-user-role.use-case';
import { GetAllUsersUseCase } from './application/use-cases/users/get-all-users.use-case';
import { RevokeUserRoleUseCase } from './application/use-cases/users/revoke-user-role.use-case';
import { ToggleUserActiveUseCase } from './application/use-cases/users/toggle-user-active.use-case';
import { UpdateUserUseCase } from './application/use-cases/users/update-user.use-case';
import { ApplicationsController } from './presentation/controllers/applications.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { RolesController } from './presentation/controllers/roles.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { GetRoleApplicationsMatrixUseCase } from './application/use-cases/roles/get-role-applications-matrix.use-case';
import { ListAuditLogsUseCase } from './application/use-cases/audit/list-audit-logs.use-case';
import { AuditLogsController } from './presentation/controllers/audit-logs.controller';
@Module({
  imports: [DatabaseModule, StorageModule, RuntimeModule, AuthRateLimitModule],
  controllers: [
    AuditLogsController,
    AuthController,
    ApplicationsController,
    UsersController,
    RolesController,
  ],
  providers: [
    ListAuditLogsUseCase,
    GetRoleApplicationsMatrixUseCase,
    GetUserApplicationsUseCase,
    GetAllApplicationsUseCase,
    GetApplicationByIdUseCase,
    CreateApplicationUseCase,
    UpdateApplicationUseCase,
    DeleteApplicationUseCase,
    GetUserRolesUseCase,
    GetAllRolesUseCase,
    GetRoleByIdUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignApplicationToRoleUseCase,
    RevokeApplicationFromRoleUseCase,
    GetApplicationsByRoleUseCase,
    GetAllUsersUseCase,
    UpdateUserUseCase,
    ToggleUserActiveUseCase,
    AssignUserRoleUseCase,
    RevokeUserRoleUseCase,
    { provide: AUTH_PORT, useClass: AuthFacade },
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
  ],
  exports: [],
})
export class IdentityModule {}
