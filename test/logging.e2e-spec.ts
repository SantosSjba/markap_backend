import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
  Post,
  Req,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger, LoggerModule, PinoLogger } from 'nestjs-pino';
import type { IncomingMessage, Server } from 'node:http';
import request from 'supertest';
import { createHttpLoggerOptions } from '../src/shared/infrastructure/logging/logger.config';
import { AllExceptionsFilter } from '../src/shared/presentation/filters/http-exception.filter';

@Controller('logging')
class LoggingProbeController {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingProbeController.name);
  }
  @Post('ok/:id') async ok(@Req() req: IncomingMessage) {
    await new Promise<void>((resolve) => setImmediate(resolve));
    this.logger.info({ event: 'test.business' }, 'Operación de prueba');
    return { requestId: req.id };
  }
  @Get('reject') reject() {
    throw new BadRequestException('Petición inválida');
  }
  @Get('fail') fail() {
    throw new Error('SECRET_FAILURE_MESSAGE');
  }
}

describe('logs HTTP con Pino', () => {
  let app: INestApplication<Server>;
  const lines: string[] = [];
  const records = () =>
    lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: [
            createHttpLoggerOptions({ NODE_ENV: 'test', LOG_LEVEL: 'info' }),
            {
              write: (line: string) => {
                lines.push(line);
              },
            },
          ],
        }),
      ],
      controllers: [LoggingProbeController],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(app.get(Logger));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    lines.length = 0;
  });
  it('correlaciona solicitudes concurrentes y no registra parámetros, cabeceras ni cuerpos', async () => {
    await Promise.all(
      ['request-A', 'request-B'].map((id) =>
        request(app.getHttpServer())
          .post('/logging/ok/SECRET_PATH?token=SECRET_QUERY')
          .set('x-request-id', id)
          .set('authorization', 'Bearer SECRET_AUTH')
          .set('cookie', 'session=SECRET_COOKIE')
          .send({ password: 'SECRET_BODY' })
          .expect(201)
          .expect('x-request-id', id),
      ),
    );
    const logged = records();
    for (const requestId of ['request-A', 'request-B']) {
      expect(
        logged.filter(
          (item) =>
            item.event === 'test.business' && item.requestId === requestId,
        ),
      ).toHaveLength(1);
      expect(
        logged.filter(
          (item) =>
            item.event === 'http.request.completed' &&
            item.requestId === requestId,
        ),
      ).toHaveLength(1);
    }
    expect(
      logged.find((item) => item.event === 'http.request.completed'),
    ).toMatchObject({
      context: 'HTTP',
      level: 'info',
      route: '/logging/ok/:id',
      res: { statusCode: 201 },
      responseTime: expect.any(Number) as unknown,
    });
    for (const secret of [
      'SECRET_PATH',
      'SECRET_QUERY',
      'SECRET_AUTH',
      'SECRET_COOKIE',
      'SECRET_BODY',
    ])
      expect(lines.join('')).not.toContain(secret);
  });
  it('genera un identificador seguro cuando el enviado no es válido', async () => {
    const response = await request(app.getHttpServer())
      .post('/logging/ok/id')
      .set('x-request-id', 'invalid id')
      .expect(201);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body).toMatchObject({
      requestId: response.headers['x-request-id'],
    });
  });
  it('usa warn para rechazos HTTP y error para fallos, sin duplicar el error', async () => {
    await request(app.getHttpServer()).get('/logging/reject').expect(400);
    expect(
      records().filter((item) => item.event === 'http.request.rejected'),
    ).toEqual([
      expect.objectContaining({ level: 'warn', res: { statusCode: 400 } }),
    ]);
    lines.length = 0;
    await request(app.getHttpServer()).get('/logging/fail').expect(500);
    expect(
      records().filter((item) => item.event === 'http.request.failed'),
    ).toEqual([
      expect.objectContaining({
        level: 'error',
        err: expect.objectContaining({ type: 'Error' }) as unknown,
        res: { statusCode: 500 },
      }),
    ]);
    expect(records().filter((item) => item.level === 'error')).toHaveLength(1);
    expect(lines.join('')).not.toContain('SECRET_FAILURE_MESSAGE');
  });
});
