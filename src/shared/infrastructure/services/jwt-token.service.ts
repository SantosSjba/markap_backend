import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import {
  type TokenPayload,
  type TokenResult,
  TokenService,
} from '../../domain/services/token.service';

const accessTokenPayload = z.object({
  sub: z.string().min(1),
  email: z.string().min(1),
});

/** Adaptador JWT; el módulo configura la firma y verificación, el dominio conserva su puerto. */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly expiresIn: number;
  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.expiresIn = config.getOrThrow<number>('jwt.expiresIn');
  }
  generateAccessToken(payload: TokenPayload): TokenResult {
    return { accessToken: this.jwt.sign(payload), expiresIn: this.expiresIn };
  }
  verifyToken(token: string): TokenPayload {
    return accessTokenPayload.parse(
      this.jwt.verify<Record<string, unknown>>(token),
    );
  }
}
