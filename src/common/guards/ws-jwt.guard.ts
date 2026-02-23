import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TokenService, TokenPayload } from '../../application/services/token.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<{ handshake: { auth?: { token?: string }; query?: { token?: string } } }>();
    const token =
      client.handshake?.auth?.token ||
      (typeof client.handshake?.query?.token === 'string'
        ? client.handshake.query.token
        : undefined);

    if (!token) {
      throw new WsException('Token no proporcionado');
    }

    try {
      const payload = this.tokenService.verifyToken(token);
      (client as unknown as { user: TokenPayload }).user = payload;
      return true;
    } catch {
      throw new WsException('Token inválido o expirado');
    }
  }
}
