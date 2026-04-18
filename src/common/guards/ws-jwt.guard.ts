import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TokenService, TokenPayload } from '../../application/services/token.service';
import { UserRepository } from '../../application/repositories/user.repository';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const user = await this.userRepository.findById(payload.sub);
      if (!user?.canAuthenticate) {
        throw new WsException('Sesión inválida. Vuelve a iniciar sesión.');
      }
      (client as unknown as { user: TokenPayload }).user = payload;
      return true;
    } catch (err) {
      if (err instanceof WsException) {
        throw err;
      }
      throw new WsException('Token inválido o expirado');
    }
  }
}
