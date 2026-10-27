import type { Prisma } from '@prisma/client';
import { rebalanceCommissionPartsToNet } from './sale-commission.util';

type Part = {
  id: string;
  partNumber: number;
  amount: number;
  status: string;
  label?: string | null;
};

/** Transacción en memoria con lo que usa el reparto de cuotas */
function fakeTx(parts: Part[]) {
  const rows = parts.map((p) => ({ ...p }));
  const tx = {
    saleCommissionPaymentPart: {
      findMany: () =>
        Promise.resolve([...rows].sort((a, b) => a.partNumber - b.partNumber)),
      update: ({
        where,
        data,
      }: {
        where: { id: string };
        data: { amount: number };
      }) => {
        rows.find((r) => r.id === where.id)!.amount = data.amount;
        return Promise.resolve();
      },
      create: ({ data }: { data: Omit<Part, 'id'> }) => {
        rows.push({ id: `new-${rows.length}`, ...data });
        return Promise.resolve();
      },
      deleteMany: ({ where }: { where: { id: { in: string[] } } }) => {
        for (const id of where.id.in) {
          rows.splice(
            rows.findIndex((r) => r.id === id),
            1,
          );
        }
        return Promise.resolve();
      },
    },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, rows };
}

describe('rebalanceCommissionPartsToNet', () => {
  it('reparte el saldo entre las cuotas pendientes sin tocar las pagadas', async () => {
    const { tx, rows } = fakeTx([
      { id: 'a', partNumber: 1, amount: 1000, status: 'PAID' },
      { id: 'b', partNumber: 2, amount: 1000, status: 'PENDING' },
    ]);
    // 2 % → 3 % sobre 100 000: neto 3 000
    await rebalanceCommissionPartsToNet(tx, 'c', 3000);
    expect(rows.map((r) => r.amount)).toEqual([1000, 2000]);
  });

  it('agrega una cuota de ajuste si la comisión ya estaba pagada y sube', async () => {
    const { tx, rows } = fakeTx([
      { id: 'a', partNumber: 1, amount: 2000, status: 'PAID' },
    ]);
    await rebalanceCommissionPartsToNet(tx, 'c', 3000);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      partNumber: 2,
      amount: 1000,
      status: 'PENDING',
    });
  });

  it('elimina las pendientes cuando lo pagado ya cubre el nuevo neto', async () => {
    const { tx, rows } = fakeTx([
      { id: 'a', partNumber: 1, amount: 1500, status: 'PAID' },
      { id: 'b', partNumber: 2, amount: 1500, status: 'PENDING' },
    ]);
    await rebalanceCommissionPartsToNet(tx, 'c', 1500);
    expect(rows.map((r) => r.id)).toEqual(['a']);
  });

  it('rechaza un neto menor a lo ya pagado', async () => {
    const { tx } = fakeTx([
      { id: 'a', partNumber: 1, amount: 2000, status: 'PAID' },
    ]);
    await expect(rebalanceCommissionPartsToNet(tx, 'c', 1500)).rejects.toThrow(
      'no puede ser menor a lo pagado',
    );
  });

  it('sin cuotas pagadas escala todas en proporción', async () => {
    const { tx, rows } = fakeTx([
      { id: 'a', partNumber: 1, amount: 600, status: 'PENDING' },
      { id: 'b', partNumber: 2, amount: 400, status: 'PENDING' },
    ]);
    await rebalanceCommissionPartsToNet(tx, 'c', 1500);
    expect(rows.map((r) => r.amount)).toEqual([900, 600]);
  });
});
