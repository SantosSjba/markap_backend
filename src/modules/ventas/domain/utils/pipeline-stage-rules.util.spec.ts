import {
  evaluateStageChange,
  missingStageDocuments,
} from './pipeline-stage-rules.util';

const ORDER = ['SEPARATION', 'ARRAS', 'MINUTA', 'PUBLIC_DEED'];

describe('reglas de etapas del pipeline', () => {
  it('no permite saltar de separación a escritura pública', () => {
    const change = evaluateStageChange(
      'SEPARATION',
      'PUBLIC_DEED',
      ORDER,
      new Set(['ARRAS', 'MINUTA', 'ESCRITURA_PUBLICA']),
    );
    expect(change).toMatchObject({ kind: 'forward', skipsStages: true });
  });

  it('exige el documento de la etapa a la que se avanza', () => {
    expect(
      evaluateStageChange('SEPARATION', 'ARRAS', ORDER, new Set()),
    ).toEqual({
      kind: 'forward',
      skipsStages: false,
      missingDocuments: ['contrato de arras'],
    });
    expect(
      evaluateStageChange('ARRAS', 'MINUTA', ORDER, new Set(['MINUTA'])),
    ).toEqual({ kind: 'forward', skipsStages: false, missingDocuments: [] });
  });

  it('identifica el retroceso y la misma etapa', () => {
    expect(
      evaluateStageChange('PUBLIC_DEED', 'MINUTA', ORDER, new Set()),
    ).toEqual({ kind: 'backward' });
    expect(evaluateStageChange('ARRAS', 'ARRAS', ORDER, new Set())).toEqual({
      kind: 'same',
    });
  });

  it('lista los documentos que faltan para iniciar más adelante', () => {
    expect(
      missingStageDocuments('SEPARATION', 'MINUTA', ORDER, new Set(['ARRAS'])),
    ).toEqual(['minuta']);
  });

  it('respeta etapas desactivadas en la configuración', () => {
    const withoutArras = ['SEPARATION', 'MINUTA', 'PUBLIC_DEED'];
    expect(
      evaluateStageChange(
        'SEPARATION',
        'MINUTA',
        withoutArras,
        new Set(['MINUTA']),
      ),
    ).toEqual({ kind: 'forward', skipsStages: false, missingDocuments: [] });
  });
});
