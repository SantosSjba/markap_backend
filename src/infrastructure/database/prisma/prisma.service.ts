import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Transacción en curso, compartida por todos los repositorios del mismo flujo. */
const ambientTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

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
  }

  async onModuleDestroy() {
    await this.$disconnect();
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
