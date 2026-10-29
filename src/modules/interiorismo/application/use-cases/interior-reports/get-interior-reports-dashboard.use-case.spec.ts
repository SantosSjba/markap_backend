import { GetInteriorReportsDashboardUseCase } from './get-interior-reports-dashboard.use-case';

describe('Rangos de reportes', () => {
  const reports = { getDashboard: jest.fn().mockResolvedValue({}) };
  const uc = new GetInteriorReportsDashboardUseCase(reports);
  it.each([
    ['2026-02-30', '2026-03-01'],
    ['2026-10-28', '2026-10-01'],
    ['2026-10-01T00:00:00Z', '2026-10-31'],
    ['1990-01-01', '2026-10-31'],
  ])('rechaza rango inválido %s / %s', async (start, end) => {
    await expect(uc.execute('interiorismo', start, end)).rejects.toThrow();
  });
  it('acepta «Todo» (desde el 2000)', async () => {
    await uc.execute('interiorismo', '2000-01-01', '2026-10-29');
    expect(reports.getDashboard).toHaveBeenLastCalledWith(
      'interiorismo',
      '2000-01-01',
      '2026-10-29',
    );
  });
  it('acepta el rango de un solo día', async () => {
    await uc.execute('interiorismo', '2026-10-27', '2026-10-27');
    expect(reports.getDashboard).toHaveBeenLastCalledWith(
      'interiorismo',
      '2026-10-27',
      '2026-10-27',
    );
  });
});
