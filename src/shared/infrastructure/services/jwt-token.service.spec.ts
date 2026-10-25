import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { TokenService } from '../../domain/services/token.service';
import { TokenModule } from '../security/token.module';

const secret = 'test-jwt-secret-at-least-16';
const payload = { sub: 'user-1', email: 'client@example.com' };
// Fixture HS256 emitido por el adaptador anterior, con jsonwebtoken y la misma clave.
const legacyToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsZWdhY3ktdXNlciIsImVtYWlsIjoibGVnYWN5QGV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDB9.0AYdIUu0V7-QQ-3Azb7KmbWMBvPmMstoFlRbhGLGWGY';

describe('adaptador @nestjs/jwt', () => {
  let module: TestingModule;
  let tokens: TokenService;
  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_100_000);
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ jwt: { secret, expiresIn: 3600 } })],
        }),
        TokenModule,
      ],
    }).compile();
    tokens = module.get(TokenService);
  });
  afterEach(async () => {
    await module.close();
    jest.restoreAllMocks();
  });
  it('conserva el payload, HS256 y la duración expresada en segundos', () => {
    const result = tokens.generateAccessToken(payload);
    expect(result.expiresIn).toBe(3600);
    expect(tokens.verifyToken(result.accessToken)).toEqual(payload);
    const decoded = JSON.parse(
      Buffer.from(result.accessToken.split('.')[1], 'base64url').toString(),
    ) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(3600);
  });
  it('acepta tokens del adaptador anterior que todavía son válidos', () => {
    expect(tokens.verifyToken(legacyToken)).toEqual({
      sub: 'legacy-user',
      email: 'legacy@example.com',
    });
  });
  it('rechaza tokens vencidos, manipulados o firmados con otra clave', () => {
    const signer = new JwtService({ secret });
    const expired = signer.sign(payload, { expiresIn: -1 });
    const differentSecret = new JwtService({
      secret: 'another-secret-at-least-16',
    }).sign(payload);
    const token = tokens.generateAccessToken(payload).accessToken;
    const parts = token.split('.');
    parts[1] = Buffer.from(
      JSON.stringify({ ...payload, sub: 'attacker' }),
    ).toString('base64url');
    for (const invalid of [expired, differentSecret, parts.join('.')])
      expect(() => tokens.verifyToken(invalid)).toThrow();
  });
  it('rechaza algoritmos alternativos y claims de identidad incompletos', () => {
    const signer = new JwtService({ secret });
    for (const invalid of [
      signer.sign(payload, { algorithm: 'HS512' }),
      signer.sign({ sub: 'user-1' }),
      signer.sign({ sub: 123, email: 'client@example.com' }),
    ])
      expect(() => tokens.verifyToken(invalid)).toThrow();
  });
});
