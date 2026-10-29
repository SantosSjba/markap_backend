import { parseInteriorBudgetRows } from './interior-budget-excel.parser';
import type { ImportedBudgetRow } from '../../domain/repositories/interior-project-budget.repository';

const flatten = (rows: ImportedBudgetRow[], depth = 0): string[] =>
  rows.flatMap((r) => [
    `${'  '.repeat(depth)}${r.kind}:${r.code ?? ''}:${r.description}`,
    ...flatten(r.children ?? [], depth + 1),
  ]);

describe('parseInteriorBudgetRows — formato Markap Spaces', () => {
  const sheet: unknown[][] = [
    [],
    [null, 'PRESUPUESTO IMPLEMENTACIÓN CASA'],
    [
      null,
      'ITEM',
      'Descripción',
      null,
      null,
      null,
      'Costo',
      'Costo Real',
      'Utilidad',
      'Total ',
      'IGV',
      'Precio',
    ],
    [null, null, 'PRIMER NIVEL '],
    [null, null, 'Sala'],
    [null, null, 'Estructurales'],
    [
      null,
      1,
      'Sistema: Chimenea de alcohol',
      null,
      null,
      null,
      2800,
      null,
      560,
      3360,
      null,
      3360,
    ],
    [null, 4, 'Pintado de estructura / muestra'],
    [null, null, 'Mobiliario:'],
    [
      null,
      9,
      'Sofá de 3 de cuero',
      null,
      null,
      null,
      5900,
      5200,
      1180,
      7080,
      null,
      7080,
    ],
    [null, null, 'gracenia, anturio, alocasia'],
    [null, null, 'Comedor'],
    [
      null,
      1,
      'Camino de mesa',
      null,
      null,
      null,
      88,
      null,
      17.6,
      105.6,
      19.01,
      124.61,
    ],
    [
      null,
      'ITEM',
      'Descripción',
      null,
      null,
      null,
      'Costo',
      'Costo Real',
      'Utilidad',
      'Total ',
      'IGV',
      'Precio',
    ],
    [null, null, 'PRIMER NIVEL y TERCER NIVEL'],
    [null, null, 'Lavandería'],
    [null, null, 'Estructurales'],
    [
      null,
      1,
      'Pintura de lavandería',
      null,
      null,
      null,
      220,
      null,
      44,
      264,
      null,
      264,
    ],
    [
      null,
      'TOTAL',
      null,
      null,
      null,
      null,
      8788,
      null,
      1757.6,
      10545.6,
      null,
      10545.6,
    ],
  ];
  const parsed = parseInteriorBudgetRows(sheet, 'Hoja2');

  it('detecta el formato y arma Nivel → Ambiente → Categoría → partidas', () => {
    expect(parsed.format).toBe('MARKAP_SPACES');
    expect(flatten(parsed.budget.rows)).toEqual([
      'GROUP::PRIMER NIVEL',
      '  GROUP::Sala',
      '    GROUP::Estructurales',
      '      ITEM::Sistema: Chimenea de alcohol',
      '      ITEM::Pintado de estructura / muestra',
      '    GROUP::Mobiliario:',
      '      ITEM::Sofá de 3 de cuero',
      '      NOTE::gracenia, anturio, alocasia',
      '  GROUP::Comedor',
      '    ITEM::Camino de mesa',
      'GROUP::PRIMER NIVEL y TERCER NIVEL',
      '  GROUP::Lavandería',
      '    GROUP::Estructurales',
      '      ITEM::Pintura de lavandería',
    ]);
  });

  it('lleva costo, costo real e IGV por línea; deduce la utilidad del Excel', () => {
    const sala = parsed.budget.rows[0].children![0];
    const [chimenea, pintado] = sala.children![0].children!;
    const sofa = sala.children![1].children![0];
    const camino = parsed.budget.rows[0].children![1].children![0];
    expect(chimenea).toMatchObject({ directCost: 2800, hasIgv: false });
    expect(pintado.directCost).toBeNull();
    expect(sofa).toMatchObject({ directCost: 5900, actualCost: 5200 });
    expect(camino.hasIgv).toBe(true);
    expect(parsed.budget.header).toMatchObject({
      marginMode: 'PER_LINE',
      utilityPct: 20,
      igvMode: 'PER_LINE',
    });
  });
});

describe('parseInteriorBudgetRows — formato PRIZE', () => {
  const sheet: unknown[][] = [
    ['       Presupuesto N° 29.08-2025'],
    ['EJECUTA: Obras Civiles Superficie '],
    ['EMPRESA ESPECIALIZADA: MARKAP SPACES '],
    ['PLAZO DE EJECUCION: 55 Dias Habiles por Nivel'],
    ['FECHA:  29/08/2025'],
    ['ITEM', 'DESCRIPCION', 'UNIDAD', 'METRADO', 'P.U.', 'PARCIAL', 'TOTAL'],
    ['A', 'OBRAS PROVISIONALES', null, null, null, null, 2000],
    ['A.1', 'TRABAJOS PRELIMINARES'],
    ['A.2', 'Movilizacion de equipos', 'glb', 1, 1000, 1000],
    ['A.3', 'Transporte', 'glb', 1, 1000, 1000],
    [null, 'PRIMER NIVEL'],
    ['1', 'OFICINAS', null, null, null, null, 6160],
    ['1.0.1', 'Sillones de escritorio', 'Und', 2, 460, 920],
    ['1.0.2', 'Mueble melamine', 'Und', 1, 0],
    ['1.0.3', 'Luminaria industrial', 'und', 1, 160],
    ['16.0.2', 'Tablero (precio cerrado)', 'und', 1, 4500, 5000],
    ['19.01', 'Equipo de aire', null, null, 3580, 12172],
    ['COSTO DIRECTO - S/.', null, null, null, null, null, 8160],
    [
      'GASTOS GENERALES Y UTILIDAD 20% + 1%',
      null,
      null,
      null,
      null,
      null,
      1713.6,
    ],
    [
      'SUB TOTAL - U$S. (Tipo de Cambio 3.50 - 03/09/2025)',
      null,
      null,
      null,
      null,
      null,
      2820,
    ],
    ['COSTOS NO INCLUYEN IGV'],
    ['1.01', 'Detalle ya incluido', 'UND', 55, 50, 2750],
  ];
  const parsed = parseInteriorBudgetRows(sheet, 'PRESUPUESTO PRIZE');

  it('arma partidas con código del Excel bajo cada nivel y omite el anexo', () => {
    expect(parsed.format).toBe('PRIZE');
    expect(flatten(parsed.budget.rows)).toEqual([
      'GROUP:A:OBRAS PROVISIONALES',
      '  NOTE::A.1 TRABAJOS PRELIMINARES',
      '  ITEM:A.2:Movilizacion de equipos',
      '  ITEM:A.3:Transporte',
      'GROUP::PRIMER NIVEL',
      '  GROUP:1:OFICINAS',
      '    ITEM:1.0.1:Sillones de escritorio',
      '    ITEM:1.0.2:Mueble melamine',
      '    ITEM:1.0.3:Luminaria industrial',
      '    ITEM:16.0.2:Tablero (precio cerrado)',
      '    ITEM:19.01:Equipo de aire',
    ]);
  });

  it('respeta el parcial del Excel cuando no es metrado × P.U. y avisa los vacíos', () => {
    const items = parsed.budget.rows[1].children![0].children!;
    expect(items[0]).toMatchObject({
      unit: 'Und',
      quantity: 2,
      unitPrice: 460,
      directCost: null,
    });
    expect(items[2]).toMatchObject({
      quantity: 1,
      unitPrice: 160,
      directCost: 0,
    });
    expect(items[3]).toMatchObject({
      quantity: 1,
      unitPrice: 4500,
      directCost: 5000,
    });
    expect(items[4]).toMatchObject({
      quantity: null,
      unitPrice: 3580,
      directCost: 12172,
    });
    expect(parsed.warnings).toEqual([
      '1.0.3 «Luminaria industrial»: sin parcial en el Excel (metrado × P.U. = 160); se importó con costo 0.',
    ]);
  });

  it('toma cabecera, GG + utilidad, tipo de cambio y «no incluye IGV»', () => {
    expect(parsed.budget.header).toMatchObject({
      number: '29.08-2025',
      executedBy: 'Obras Civiles Superficie',
      executionTerm: '55 Dias Habiles por Nivel',
      marginMode: 'GLOBAL',
      utilityPct: 20,
      overheadPct: 1,
      exchangeRate: 3.5,
      igvMode: 'NONE',
    });
    expect(parsed.budget.header.issuedAt?.toISOString().slice(0, 10)).toBe(
      '2025-08-29',
    );
  });
});
