import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { CreateContabilidadJournalEntryDto } from '../../../modules/contabilidad/presentation/dtos/contabilidad/contabilidad-journal.dto';
import { CreateClientDto } from '../../../modules/crm/presentation/dtos/clients/create-client.dto';
import { LoginDto } from '../../../modules/identity/presentation/dtos/auth/login.dto';
import { UpdateRentalDto } from '../../../modules/rentals/presentation/dtos/rentals/update-rental.dto';
import { UBIGEO_OTHER_DISTRICT_ID } from '../../constants/ubigeo-other.constants';
import { validationExceptionFactory } from '../pipes/validation-messages';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  booleanInput,
  dateOnlyInput,
  numericInput,
  optionalValue,
} from './input-schemas';

const client = {
  clientType: 'RESIDENTIAL',
  documentTypeId: 'document-type',
  documentNumber: '12345678',
  fullName: 'Cliente',
  primaryPhone: '999999999',
};

describe('DTOs con Zod', () => {
  it('valida mediante el pipe real y conserva el contrato del DTO', () => {
    const value: unknown = new ZodValidationPipe().transform(
      { email: 'client@example.com', password: 'password123' },
      { type: 'body', metatype: LoginDto },
    );
    expect(value).toEqual({
      email: 'client@example.com',
      password: 'password123',
    });
  });
  it('rechaza propiedades desconocidas', () => {
    expect(() => {
      new ZodValidationPipe().transform(
        { email: 'client@example.com', password: 'password123', isAdmin: true },
        { type: 'body', metatype: LoginDto },
      );
    }).toThrow(BadRequestException);
  });
  it('conserva nulos y campos omitidos en actualizaciones parciales', () => {
    expect(UpdateRentalDto.schema.parse({ notes: null })).toEqual({
      notes: null,
    });
    expect(UpdateRentalDto.schema.parse({})).toEqual({});
  });
  it('requiere dirección para propietarios e inquilinos, y permite omitirla para clientes de proyectos', () => {
    expect(CreateClientDto.schema.safeParse(client).success).toBe(true);
    for (const clientType of ['OWNER', 'TENANT'])
      expect(
        CreateClientDto.schema.safeParse({ ...client, clientType }).success,
      ).toBe(false);
  });
  it('valida ubicaciones libres anidadas solo cuando corresponde al distrito Otros', () => {
    const address = {
      addressLine: 'Dirección',
      districtId: UBIGEO_OTHER_DISTRICT_ID,
    };
    expect(
      CreateClientDto.schema.safeParse({
        ...client,
        clientType: 'OWNER',
        address,
      }).success,
    ).toBe(false);
    const locationCustom = {
      country: 'Perú',
      department: 'Lima',
      province: 'Lima',
      district: 'Miraflores',
    };
    expect(
      CreateClientDto.schema.safeParse({
        ...client,
        clientType: 'OWNER',
        address: { ...address, locationCustom },
      }).success,
    ).toBe(true);
  });
  it('conserva importes numéricos de formularios y rechaza valores que no son importes', () => {
    const input = {
      periodId: 'period-1',
      entryDate: '2026-10-25',
      description: 'Asiento',
      lines: [{ accountId: 'account-1', debit: '150,50', credit: '' }],
    };
    expect(CreateContabilidadJournalEntryDto.schema.parse(input)).toEqual(
      input,
    );
    const result = CreateContabilidadJournalEntryDto.schema.safeParse({
      ...input,
      lines: [{ accountId: 'account-1', debit: { invalid: true } }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = validationExceptionFactory(
        result.error,
      ).getResponse() as { message: string[] };
      expect(
        response.message.some((message) =>
          message.includes('fila 1 de líneas'),
        ),
      ).toBe(true);
    }
  });
});

describe('reglas de entrada compartidas', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['1', true],
    ['0', false],
  ])('interpreta %p como %p', (input, expected) => {
    expect(booleanInput.parse(input)).toBe(expected);
  });
  it('rechaza booleanos ambiguos', () => {
    expect(booleanInput.safeParse('quizás').success).toBe(false);
  });
  it('admite coma decimal y preserva valores opcionales vacíos', () => {
    expect(numericInput.parse(' 150,50 ')).toBe(' 150,50 ');
    for (const value of ['', null, undefined])
      expect(optionalValue(z.string().min(3)).parse(value)).toBe(value);
  });
  it('rechaza fechas inexistentes y admite fechas civiles y marcas ISO', () => {
    expect(dateOnlyInput.safeParse('2026-02-30').success).toBe(false);
    expect(dateOnlyInput.parse('2026-10-25')).toBe('2026-10-25');
    expect(dateOnlyInput.parse('2026-10-25T10:00:00Z')).toBe(
      '2026-10-25T10:00:00Z',
    );
  });
});
