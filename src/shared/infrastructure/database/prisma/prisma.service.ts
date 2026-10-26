import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createAuditExtension } from '../../audit/prisma-audit.extension';

/** Transacción en curso, compartida por todos los repositorios del mismo flujo. */
const ambientTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

/** Accesores de modelo (`prisma.role`, `prisma.client`…) que pasan por el cliente auditado. */
const MODEL_ACCESSORS: ReadonlySet<string> = new Set(
  Prisma.dmmf.datamodel.models.map(
    (m) => m.name.charAt(0).toLowerCase() + m.name.slice(1),
  ),
);

/**
 * Corre fn con tx como transacción ambiente. El `await` dentro de run() importa:
 * las promesas de Prisma son perezosas y se ejecutan al hacer `then`; si fn
 * devolviera una sin esperarla, se ejecutaría fuera del contexto de la
 * transacción.
 */
function runInTransaction<T>(
  tx: Prisma.TransactionClient,
  fn: () => Promise<T>,
): Promise<T> {
  return ambientTransaction.run(tx, async () => await fn());
}

const TRANSACTION_DEFAULTS = { maxWait: 10_000, timeout: 30_000 };

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

/** Datos que Prisma guarda en cada promesa de modelo (`prisma.x.update(...)`). */
type PromiseSpec = { model?: string; action?: string; args?: unknown };

type AnyDelegate = Record<string, (args: unknown) => Promise<unknown>>;

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  /** Cliente con la extensión de auditoría; toda escritura de modelo pasa por él. */
  private extended!: PrismaClient;
  private baseAudit!: PrismaClient['auditLog'];

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

    this.baseAudit = this.auditLog;
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
    // Fuera de ella, los modelos y $transaction salen del cliente extendido (auditado).
    const proxy = new Proxy(this, {
      get(target, prop, receiver) {
        const tx = ambientTransaction.getStore();
        if (!tx) {
          if (prop === '$transaction')
            return (arg: unknown, options?: TransactionOptions) =>
              target.runTransaction(receiver as PrismaService, arg, options);
          if (typeof prop === 'string' && MODEL_ACCESSORS.has(prop))
            return Reflect.get(target.extended, prop) as unknown;
          return Reflect.get(target, prop, receiver);
        }
        if (prop === 'atomic') return Reflect.get(target, prop, receiver);
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
    this.extended = this.$extends(
      createAuditExtension(proxy),
    ) as unknown as PrismaClient;
    return proxy;
  }

  /** Indica si el flujo actual corre dentro de atomic() o de un $transaction(callback). */
  inTransaction(): boolean {
    return ambientTransaction.getStore() !== undefined;
  }

  /**
   * Ejecuta fn en una sola transacción; si ya hay una en curso, se une a ella.
   * Así, por ejemplo, el asiento, el movimiento de tesorería y el saldo de la
   * factura se confirman o se descartan juntos.
   */
  atomic<T>(fn: () => Promise<T>): Promise<T> {
    if (ambientTransaction.getStore()) return fn();
    return this.extended.$transaction(
      (tx) => runInTransaction(tx, fn),
      TRANSACTION_DEFAULTS,
    );
  }

  /**
   * `$transaction` fuera de una transacción ambiente. La forma callback abre la
   * transacción en el cliente extendido y la deja como ambiente, para que el
   * gancho de auditoría escriba en ella. La forma array se re-ejecuta en
   * secuencia dentro de atomic(), porque cada operación auditada necesita
   * lecturas y escrituras extra en la misma transacción.
   */
  private runTransaction(
    self: PrismaService,
    arg: unknown,
    options?: TransactionOptions,
  ): Promise<unknown> {
    if (typeof arg === 'function') {
      const fn = arg as (tx: Prisma.TransactionClient) => Promise<unknown>;
      return this.extended.$transaction(
        (tx) => runInTransaction(tx, () => fn(tx)),
        { ...TRANSACTION_DEFAULTS, ...options },
      );
    }
    const promises = arg as Prisma.PrismaPromise<unknown>[];
    const specs = promises.map(
      (p) => (p as unknown as { spec?: PromiseSpec }).spec,
    );
    if (!specs.every((s) => s?.model && s.action))
      return this.extended.$transaction(promises, options);
    return self.atomic(async () => {
      const results: unknown[] = [];
      for (const spec of specs as Required<PromiseSpec>[]) {
        const accessor =
          spec.model.charAt(0).toLowerCase() + spec.model.slice(1);
        const delegate = (self as unknown as Record<string, AnyDelegate>)[
          accessor
        ];
        results.push(await delegate[spec.action](spec.args));
      }
      return results;
    });
  }

  /** Los eventos de rechazo deben sobrevivir al rollback del request. */
  recordAuditOutsideTransaction(data: Prisma.AuditLogCreateInput) {
    return this.baseAudit.create({ data });
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
