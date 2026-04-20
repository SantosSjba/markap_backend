/**
 * Payload del token JWT
 */
export interface TokenPayload {
  sub: string; // User ID
  email: string;
}

/**
 * Resultado de la generación de tokens
 */
export interface TokenResult {
  accessToken: string;
  expiresIn: number;
}

/**
 * Token Service Interface
 *
 * Contrato para el servicio de generación y validación de tokens JWT.
 */
export abstract class TokenService {
  /**
   * Genera un access token
   */
  abstract generateAccessToken(payload: TokenPayload): TokenResult;

  /**
   * Verifica y decodifica un token
   */
  abstract verifyToken(token: string): TokenPayload;
}
