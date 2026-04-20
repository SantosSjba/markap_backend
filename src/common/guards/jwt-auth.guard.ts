import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService, TokenPayload } from '@domain/services/token.service';
import { UserRepository } from '@domain/repositories/user.repository';

/**
 * Request con usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

/**
 * JWT Auth Guard
 *
 * Guard para proteger rutas que requieren autenticación.
 * Tras un reset de BD u otros cambios, el JWT puede seguir siendo válido pero el `sub`
 * ya no existir; sin esta comprobación el usuario vería p. ej. cero aplicaciones asignadas.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = this.tokenService.verifyToken(token);
      const user = await this.userRepository.findById(payload.sub);
      if (!user?.canAuthenticate) {
        throw new UnauthorizedException(
          'Sesión inválida. Vuelve a iniciar sesión.',
        );
      }
      (request as AuthenticatedRequest).user = payload;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
