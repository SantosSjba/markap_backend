import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
  TokenService,
  TokenPayload,
  TokenResult,
} from '../../application/services/token.service';

/**
 * JWT Token Service
 *
 * Implementación del servicio de tokens usando jsonwebtoken.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly secret: string;
  private readonly expiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('jwt.secret') || 'default-secret-change-me';
    this.expiresIn = this.configService.get<number>('jwt.expiresIn') || 3600;
  }

  generateAccessToken(payload: TokenPayload): TokenResult {
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });

    return {
      accessToken,
      expiresIn: this.expiresIn,
    };
  }

  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret) as TokenPayload;
    return {
      sub: decoded.sub,
      email: decoded.email,
    };
  }
}
