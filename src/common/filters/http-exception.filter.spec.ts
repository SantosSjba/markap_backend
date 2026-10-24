import { NotFoundException, type ArgumentsHost } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { EntityNotFoundException } from '@domain/exceptions';
import { validationExceptionFactory } from '../pipes/validation-messages';
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

describe('Mensajes comprensibles para el usuario', () => {
  function run(exception: unknown) {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method: 'GET', url: '/api/prueba' }),
      }),
    } as unknown as ArgumentsHost;
    const filter = new AllExceptionsFilter();
    jest
      .spyOn(
        (filter as unknown as { logger: { error: () => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);
    filter.catch(exception, host);
    const [[body]] = response.json.mock.calls as unknown[][];
    return body as {
      statusCode: number;
      message: string;
    };
  }

  it('un error inesperado no expone el detalle técnico y remite a soporte', () => {
    const body = run(new TypeError('Cannot read properties of undefined'));
    expect(body.statusCode).toBe(500);
    expect(body.message).toContain('comunícate con soporte');
    expect(body.message).not.toContain('undefined');
  });

  it('una ruta inexistente responde en español', () => {
    const body = run(new NotFoundException('Cannot GET /api/nada'));
    expect(body.message).toBe('El recurso solicitado no existe.');
  });

  it('un registro inexistente no muestra su identificador', () => {
    const body = run(new EntityNotFoundException('Rental', 'abc-123'));
    expect(body.statusCode).toBe(404);
    expect(body.message).not.toContain('abc-123');
    expect(body.message).toContain('contrato de alquiler');
  });
});

describe('Validación de datos en español', () => {
  it('indica la fila de una lista anidada con nombres en español', () => {
    const errors = [
      {
        property: 'lines',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'debit',
                constraints: { isAmount: 'debit must be an amount' },
              },
            ],
          },
        ],
      },
    ] as ValidationError[];
    const response = validationExceptionFactory(errors).getResponse() as {
      message: string[];
    };
    expect(response.message).toEqual([
      'El campo «debe (fila 1 de líneas)» debe ser un importe numérico.',
    ]);
  });

  it('traduce los mensajes por defecto y conserva los personalizados', () => {
    const errors = [
      {
        property: 'amount',
        constraints: {
          isNumber:
            'amount must be a number conforming to the specified constraints',
        },
      },
      {
        property: 'extra',
        constraints: { whitelistValidation: 'property extra should not exist' },
      },
      {
        property: 'ruc',
        constraints: { matches: 'El RUC debe tener 11 dígitos' },
      },
    ] as ValidationError[];
    const response = validationExceptionFactory(errors).getResponse() as {
      message: string[];
    };
    expect(response.message).toEqual([
      'El campo «importe» debe ser un número válido.',
      'El campo «extra» no está permitido.',
      'El RUC debe tener 11 dígitos',
    ]);
  });
});
