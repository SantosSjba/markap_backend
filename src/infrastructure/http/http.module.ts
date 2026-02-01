import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Services
import { HashService } from '../../application/services/hash.service';
import { TokenService } from '../../application/services/token.service';
import { BcryptHashService } from '../services/bcrypt-hash.service';
import { JwtTokenService } from '../services/jwt-token.service';

// Use Cases - Auth
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
} from '../../application/use-cases/auth';

// Use Cases - Applications
import { GetUserApplicationsUseCase } from '../../application/use-cases/applications';

// Use Cases - Roles
import { GetUserRolesUseCase } from '../../application/use-cases/roles';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { ApplicationsController } from './controllers/applications.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, ApplicationsController],
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

    // Guards
    JwtAuthGuard,

    // Use Cases - Auth
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,

    // Use Cases - Applications
    GetUserApplicationsUseCase,

    // Use Cases - Roles
    GetUserRolesUseCase,
  ],
  exports: [HashService, TokenService],
})
export class HttpModule {}
