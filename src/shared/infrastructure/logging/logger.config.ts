import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino, { type LoggerOptions } from 'pino';
import type { Options } from 'pino-http';
import { serializeError } from './error.serializer';

export type LogEnvironment = Record<string, string | undefined>;
const LEVELS = new Set([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
]);
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'resetCode',
  'verificationCode',
  'codeVerifier',
  'clientSecret',
  'accessKey',
  'secretKey',
  'connectionString',
];

export function createLoggerOptions(
  env: LogEnvironment = process.env,
): LoggerOptions {
  const defaultLevel = env.NODE_ENV === 'test' ? 'silent' : 'info';
  const level =
    env.LOG_LEVEL && LEVELS.has(env.LOG_LEVEL) ? env.LOG_LEVEL : defaultLevel;
  return {
    level,
    base: {
      service: 'markap-api',
      environment: env.NODE_ENV ?? 'development',
      ...(env.APP_VERSION ? { version: env.APP_VERSION } : {}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      log: (fields) => ({ event: 'application.log', ...fields }),
    },
    serializers: { err: serializeError },
    redact: {
      paths: [
        ...SENSITIVE_FIELDS.flatMap((field) => [
          field,
          `*.${field}`,
          `*.*.${field}`,
        ]),
        'body',
        'req.body',
        'payload',
        'req.query',
        'req.headers',
        'res.headers',
        'html',
        'buffer',
        '*.html',
        '*.buffer',
      ],
      remove: true,
    },
    ...(env.LOG_PRETTY === 'true' && env.NODE_ENV !== 'production'
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  };
}

/** No registra URLs crudas: los parámetros de consulta pueden contener credenciales. */
function requestRoute(req: IncomingMessage): string {
  const routeRequest = req as IncomingMessage & {
    route?: { path?: unknown };
    baseUrl?: string;
  };
  return typeof routeRequest.route?.path === 'string'
    ? `${routeRequest.baseUrl ?? ''}${routeRequest.route.path}`
    : 'unmatched';
}

export function createHttpLoggerOptions(
  env: LogEnvironment = process.env,
): Options {
  return {
    ...createLoggerOptions(env),
    genReqId: (req, res) => {
      const supplied = req.headers['x-request-id'];
      const id =
        typeof supplied === 'string' &&
        /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(supplied)
          ? supplied
          : randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    wrapSerializers: false,
    serializers: {
      err: serializeError,
      req: (req: IncomingMessage) => ({ id: req.id, method: req.method }),
      res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
    },
    customProps: (req) => ({ requestId: req.id }),
    customLogLevel: (_req, res, error) =>
      error || res.statusCode >= 500
        ? 'error'
        : res.statusCode >= 400
          ? 'warn'
          : 'info',
    customSuccessMessage: (_req, res) =>
      res.statusCode >= 400
        ? 'Solicitud HTTP rechazada'
        : 'Solicitud HTTP completada',
    customErrorMessage: () => 'Solicitud HTTP fallida',
    customSuccessObject: (req, res, value: Record<string, unknown>) => ({
      ...value,
      context: 'HTTP',
      event:
        res.statusCode >= 400
          ? 'http.request.rejected'
          : 'http.request.completed',
      route: requestRoute(req),
    }),
    customErrorObject: (req, _res, _error, value: Record<string, unknown>) => ({
      ...value,
      context: 'HTTP',
      event: 'http.request.failed',
      route: requestRoute(req),
    }),
  };
}
