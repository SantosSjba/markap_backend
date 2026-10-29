import {
  buildInteriorProjectCode,
  suggestClientSurname,
} from './interior-project-code.util';

describe('buildInteriorProjectCode', () => {
  it('arma operación + año + tipo + distrito + apellido', () => {
    expect(
      buildInteriorProjectCode(
        {
          year: 2026,
          typeLabel: 'Diseño interior',
          district: 'Cayma',
          clientSurname: 'Torres',
        },
        [],
      ),
    ).toBe('PROYECTO-2026-DISEÑO-CAYMA-TORRES');
  });

  it('normaliza partes y omite las vacías', () => {
    expect(
      buildInteriorProjectCode(
        {
          year: 2026,
          typeLabel: 'Remodelación',
          district: ' San-Isidro ',
          clientSurname: 'pérez',
        },
        [],
      ),
    ).toBe('PROYECTO-2026-REMODELACIÓN-SAN ISIDRO-PÉREZ');
    expect(buildInteriorProjectCode({ year: 2026 }, [])).toBe('PROYECTO-2026');
  });

  it('agrega sufijo si el código ya existe', () => {
    expect(
      buildInteriorProjectCode(
        {
          year: 2026,
          typeLabel: 'Diseño interior',
          district: 'Cayma',
          clientSurname: 'Torres',
        },
        ['PROYECTO-2026-DISEÑO-CAYMA-TORRES'],
      ),
    ).toBe('PROYECTO-2026-DISEÑO-CAYMA-TORRES-2');
  });

  it('toma el apellido paterno de personas y la primera palabra de empresas', () => {
    expect(suggestClientSurname('Ana María Torres Vega')).toBe('Torres');
    expect(suggestClientSurname('Constructora Andina SAC', '20123456789')).toBe(
      'Constructora',
    );
    expect(suggestClientSurname('Prize')).toBe('Prize');
  });
});
