import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './http-exception.filter';

describe('Restricciones de integridad HTTP', () => {
  it.each([
    ['P2002', 409],
    ['P2003', 409],
    ['P2025', 404],
    ['P2034', 409],
  ])('convierte %s en una respuesta de negocio %s', (code, status) => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    new AllExceptionsFilter().catch(
      new Prisma.PrismaClientKnownRequestError('Detalles internos', {
        code: String(code),
        clientVersion: 'test',
      }),
      host,
    );
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status }),
    );
    const json = JSON.stringify(response.json.mock.calls);
    expect(json).not.toContain('Detalles internos');
  });
});
