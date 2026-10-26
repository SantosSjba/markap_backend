import { ApplicationAccessService } from './application-access.service';
import { ApplicationAccessRepository } from '../../domain/repositories/application-access.repository';
describe('niveles efectivos', () => {
  const getAssignments = jest.fn();
  let service: ApplicationAccessService;
  beforeEach(() => {
    jest.useFakeTimers();
    getAssignments.mockReset();
    service = new ApplicationAccessService({
      getAssignments,
    } as unknown as ApplicationAccessRepository);
  });
  afterEach(() => jest.useRealTimers());
  it('elige el máximo y aplica una revocación tras invalidar', async () => {
    getAssignments.mockResolvedValue([
      { slug: 'ventas', applicationId: 'a', name: 'Ventas', level: 'READ' },
      { slug: 'ventas', applicationId: 'a', name: 'Ventas', level: 'WRITE' },
    ]);
    expect((await service.getLevels('u')).get('ventas')?.level).toBe('WRITE');
    getAssignments.mockResolvedValue([
      { slug: 'ventas', applicationId: 'a', name: 'Ventas', level: 'READ' },
    ]);
    service.invalidate('u');
    expect((await service.getLevels('u')).get('ventas')?.level).toBe('READ');
  });
  it('expira la caché en 30 segundos y no permite mutarla desde fuera', async () => {
    getAssignments.mockResolvedValue([
      { slug: 'ventas', applicationId: 'a', name: 'Ventas', level: 'ADMIN' },
    ]);
    const first = await service.getLevels('u');
    first.clear();
    expect((await service.getLevels('u')).has('ventas')).toBe(true);
    expect(getAssignments).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(30000);
    await service.getLevels('u');
    expect(getAssignments).toHaveBeenCalledTimes(2);
  });
});
