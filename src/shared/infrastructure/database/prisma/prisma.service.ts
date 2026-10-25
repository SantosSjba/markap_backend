import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AsyncLocalStorage } from 'node:async_hooks';

/** Transacción en curso, compartida por todos los repositorios del mismo flujo. */
const ambientTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({
      adapter,
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.logger.setContext(PrismaService.name);
    this.$on('warn', (event) =>
      this.logger.warn(
        { event: 'database.client.warning', target: event.target },
        'Advertencia del cliente de base de datos',
      ),
    );
    this.$on('error', (event) =>
      this.logger.debug(
        { event: 'database.client.error', target: event.target },
        'Fallo del cliente de base de datos; el flujo registra su resultado',
      ),
    );

    // Dentro de atomic(), cualquier acceso a this.prisma usa la transacción en curso.
    return new Proxy(this, {
      get(target, prop, receiver) {
        const tx = ambientTransaction.getStore();
        if (!tx || prop === 'atomic')
          return Reflect.get(target, prop, receiver);
        if (prop === '$transaction') {
          return async (arg: unknown) => {
            if (typeof arg === 'function')
              return (arg as (t: Prisma.TransactionClient) => unknown)(tx);
            const results: unknown[] = [];
            for (const query of arg as Promise<unknown>[])
              results.push(await query);
            return results;
          };
        }
        if (typeof prop === 'string' && prop in tx) {
          const value: unknown = Reflect.get(tx, prop);
          return typeof value === 'function'
            ? ((value as (...a: unknown[]) => unknown).bind(tx) as unknown)
            : value;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  /**
   * Ejecuta fn en una sola transacción; si ya hay una en curso, se une a ella.
   * Así, por ejemplo, el asiento, el movimiento de tesorería y el saldo de la
   * factura se confirman o se descartan juntos.
   */
  atomic<T>(fn: () => Promise<T>): Promise<T> {
    if (ambientTransaction.getStore()) return fn();
    return this.$transaction((tx) => ambientTransaction.run(tx, fn), {
      maxWait: 10_000,
      timeout: 30_000,
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.info(
      { event: 'database.connected' },
      'Conexión de base de datos establecida',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info(
      { event: 'database.disconnected' },
      'Conexión de base de datos cerrada',
    );
  }
}

/** Ejecuta el método del repositorio dentro de PrismaService.atomic(). */
export function Atomic(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    descriptor.value = function (
      this: { prisma: PrismaService },
      ...args: unknown[]
    ) {
      return this.prisma.atomic(
        () => original.apply(this, args) as Promise<unknown>,
      );
    };
  };
}
