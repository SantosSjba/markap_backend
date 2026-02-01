import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Services
import { HashService } from '../../application/services/hash.service';
import { TokenService } from '../../application/services/token.service';
import { BcryptHashService } from '../services/bcrypt-hash.service';
import { JwtTokenService } from '../services/jwt-token.service';

// Use Cases
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
} from '../../application/use-cases/auth';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
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

    // Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserProfileUseCase,
  ],
  exports: [HashService, TokenService],
})
export class HttpModule {}
