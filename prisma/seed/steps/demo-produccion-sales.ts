import { Prisma } from '@prisma/client';
import { PRODUCCION_APPLICATION_SLUG } from '../data';
import type { SeedDb } from '../types';

/**
 * Cotizaciones, pedidos y entregas demo.
 */
export async function seedProduccionSales(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
): Promise<void> {
  const appId = appIdBySlug[PRODUCCION_APPLICATION_SLUG];
  if (!appId) {
    console.log('\n⚠️  produccion app not found — skipping sales seed');
    return;
  }

  const count = await prisma.produccionQuotation.count({ where: { applicationId: appId } });
  if (count > 0) {
    console.log('\n💼 Ventas producción ya sembradas — omitiendo');
    return;
  }

  const mesa = await prisma.produccionFurniture.findFirst({
    where: { applicationId: appId, code: 'MUE-COM-001' },
  });
  const escritorio = await prisma.produccionFurniture.findFirst({
    where: { applicationId: appId, code: 'MUE-ESC-001' },
  });
  if (!mesa) {
    console.log('\n⚠️  Sin muebles demo — omitiendo seed ventas');
    return;
  }

  const client = await prisma.client.findFirst({
    where: { applicationId: appId, clientType: 'RESIDENTIAL' },
    orderBy: { createdAt: 'asc' },
  });
  if (!client) {
    console.log('\n⚠️  Sin clientes demo — omitiendo seed ventas');
    return;
  }

  console.log('\n💼 Creando cotizaciones y pedidos demo…');

  const year = new Date().getFullYear();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Cotización enviada
  const cotSent = await prisma.produccionQuotation.create({
    data: {
      applicationId: appId,
      clientId: client.id,
      code: `COT-${year}-0001`,
      status: 'SENT',
      validUntil,
      sentAt: new Date(),
      notes: 'Cotización mesa comedor — cliente residencial',
      lines: {
        create: [
          {
            furnitureId: mesa.id,
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(2850),
          },
        ],
      },
    },
  });

  // Cotización aceptada → pedido pendiente
  const cotAccepted = await prisma.produccionQuotation.create({
    data: {
      applicationId: appId,
      clientId: client.id,
      code: `COT-${year}-0002`,
      status: 'ACCEPTED',
      validUntil,
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Pack oficina — escritorio',
      lines: {
        create: escritorio
          ? [
              {
                furnitureId: escritorio.id,
                quantity: new Prisma.Decimal(2),
                unitPrice: new Prisma.Decimal(1950),
              },
            ]
          : [
              {
                furnitureId: mesa.id,
                quantity: new Prisma.Decimal(1),
                unitPrice: new Prisma.Decimal(2850),
              },
            ],
      },
    },
    include: { lines: true },
  });

  const orderPending = await prisma.produccionOrder.create({
    data: {
      applicationId: appId,
      clientId: client.id,
      quotationId: cotAccepted.id,
      code: `PED-${year}-0001`,
      status: 'PENDING',
      orderedAt: new Date(),
      lines: {
        create: cotAccepted.lines.map((l) => ({
          furnitureId: l.furnitureId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          notes: l.notes,
        })),
      },
    },
  });

  // Cotización borrador
  await prisma.produccionQuotation.create({
    data: {
      applicationId: appId,
      clientId: client.id,
      code: `COT-${year}-0003`,
      status: 'DRAFT',
      validUntil,
      notes: 'Borrador — pendiente de revisión',
      lines: {
        create: [
          {
            furnitureId: mesa.id,
            quantity: new Prisma.Decimal(2),
            unitPrice: new Prisma.Decimal(2700),
          },
        ],
      },
    },
  });

  // Pedido confirmado con entrega programada
  const orderConfirmed = await prisma.produccionOrder.create({
    data: {
      applicationId: appId,
      clientId: client.id,
      code: `PED-${year}-0002`,
      status: 'READY',
      orderedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      notes: 'Pedido listo para entrega',
      lines: {
        create: [
          {
            furnitureId: mesa.id,
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(2850),
          },
        ],
      },
    },
  });

  await prisma.produccionDelivery.create({
    data: {
      applicationId: appId,
      orderId: orderConfirmed.id,
      code: `ENT-${year}-0001`,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      address: 'Av. Ejemplo 123, Lima',
      recipientName: client.fullName,
      notes: `Entrega pedido ${orderConfirmed.code}`,
    },
  });

  void cotSent;
  void orderPending;
}
