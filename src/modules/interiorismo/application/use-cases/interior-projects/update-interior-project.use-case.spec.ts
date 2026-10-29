import { UpdateInteriorProjectUseCase } from './update-interior-project.use-case';

/** Repositorio y referencias mínimas: solo lo que usa el cambio de etapa. */
function setup(previousStatus: string) {
  const repo = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'p1', status: previousStatus, code: 'X' }),
    update: jest.fn().mockResolvedValue({ id: 'p1' }),
    createActivity: jest.fn().mockResolvedValue(undefined),
    listCodesWithPrefix: jest.fn(),
  };
  const references = {
    findProjectScope: jest.fn().mockResolvedValue({ applicationId: 'app' }),
    findApplicationBySlug: jest.fn().mockResolvedValue({ id: 'app' }),
    projectClientExists: jest.fn(),
    agentExists: jest.fn().mockResolvedValue(true),
  };
  const config = {
    listProjectStages: jest.fn().mockResolvedValue([
      { code: 'DESIGN', label: 'Diseño' },
      { code: 'IN_PROGRESS', label: 'Ejecución' },
    ]),
  };
  const uc = new UpdateInteriorProjectUseCase(
    repo as never,
    references as never,
    config as never,
  );
  return { uc, repo };
}

describe('UpdateInteriorProjectUseCase — actividad', () => {
  it('anota el cambio de etapa con los nombres configurados', async () => {
    const { uc, repo } = setup('DESIGN');
    await uc.execute('p1', 'interiorismo', { status: 'IN_PROGRESS' });
    expect(repo.createActivity).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        activityType: 'STATUS_CHANGE',
        title: 'Etapa: Diseño → Ejecución',
      }),
    );
  });

  it('no anota nada si la etapa no cambia o no se envía', async () => {
    const same = setup('DESIGN');
    await same.uc.execute('p1', 'interiorismo', { status: 'DESIGN' });
    expect(same.repo.createActivity).not.toHaveBeenCalled();

    const other = setup('DESIGN');
    await other.uc.execute('p1', 'interiorismo', { name: 'Nuevo nombre' });
    expect(other.repo.createActivity).not.toHaveBeenCalled();
  });
});
