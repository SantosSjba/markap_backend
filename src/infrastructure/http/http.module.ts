import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Services
import { HashService } from '../../application/services/hash.service';
import { TokenService } from '../../application/services/token.service';
import { MailService } from '../../application/services/mail.service';
import { BcryptHashService } from '../services/bcrypt-hash.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { NodemailerMailService } from '../services/nodemailer-mail.service';

// Use Cases - Auth
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '../../application/use-cases/auth';

// Use Cases - Applications
import {
  GetUserApplicationsUseCase,
  GetAllApplicationsUseCase,
  GetApplicationByIdUseCase,
  CreateApplicationUseCase,
  UpdateApplicationUseCase,
  DeleteApplicationUseCase,
} from '../../application/use-cases/applications';

// Use Cases - Menus
import {
  GetMenusByApplicationUseCase,
  GetMenusFlatUseCase,
  CreateMenuUseCase,
  UpdateMenuUseCase,
  DeleteMenuUseCase,
} from '../../application/use-cases/menus';

// Use Cases - Roles
import {
  GetUserRolesUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  AssignApplicationToRoleUseCase,
  RevokeApplicationFromRoleUseCase,
} from '../../application/use-cases/roles';

// Use Cases - Users
import {
  GetAllUsersUseCase,
  UpdateUserUseCase,
  ToggleUserActiveUseCase,
  AssignUserRoleUseCase,
  RevokeUserRoleUseCase,
} from '../../application/use-cases/users';

// Use Cases - Clients
import {
  CreateClientUseCase,
  ListClientsUseCase,
  GetClientStatsUseCase,
  GetClientByIdUseCase,
  UpdateClientUseCase,
} from '../../application/use-cases/clients';

// Use Cases - Properties
import { CreatePropertyUseCase } from '../../application/use-cases/properties';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { ApplicationsController } from './controllers/applications.controller';
import { UsersController } from './controllers/users.controller';
import { RolesController } from './controllers/roles.controller';
import { MenusController } from './controllers/menus.controller';
import { ClientsController } from './controllers/clients.controller';
import { PropertiesController } from './controllers/properties.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AuthController,
    ApplicationsController,
    UsersController,
    RolesController,
    MenusController,
    ClientsController,
    PropertiesController,
  ],
  providers: [
    // Services
    {
      provide: HashService,
      useClass: BcryptHashService,
    },
    {
      provide: TokenService,
      useClass: JwtTokenService,
    },
    {
      provide: MailService,
      useClass: NodemailerMailService,
    },

    // Guards
    JwtAuthGuard,

    // Use Cases - Auth
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,

    // Use Cases - Applications
    GetUserApplicationsUseCase,
    GetAllApplicationsUseCase,
    GetApplicationByIdUseCase,
    CreateApplicationUseCase,
    UpdateApplicationUseCase,
    DeleteApplicationUseCase,

    // Use Cases - Menus
    GetMenusByApplicationUseCase,
    GetMenusFlatUseCase,
    CreateMenuUseCase,
    UpdateMenuUseCase,
    DeleteMenuUseCase,

    // Use Cases - Roles
    GetUserRolesUseCase,
    GetAllRolesUseCase,
    GetRoleByIdUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignApplicationToRoleUseCase,
    RevokeApplicationFromRoleUseCase,

    // Use Cases - Users
    GetAllUsersUseCase,
    UpdateUserUseCase,
    ToggleUserActiveUseCase,
    AssignUserRoleUseCase,
    RevokeUserRoleUseCase,

    // Use Cases - Clients
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientStatsUseCase,
    GetClientByIdUseCase,
    UpdateClientUseCase,

    // Use Cases - Properties
    CreatePropertyUseCase,
  ],
  exports: [HashService, TokenService, MailService],
})
export class HttpModule {}
