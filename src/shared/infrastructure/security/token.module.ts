import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../../domain/services/token.service';
import { JwtTokenService } from '../services/jwt-token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.getOrThrow<number>('jwt.expiresIn'),
          algorithm: 'HS256' as const,
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  providers: [{ provide: TokenService, useClass: JwtTokenService }],
  exports: [TokenService],
})
export class TokenModule {}
