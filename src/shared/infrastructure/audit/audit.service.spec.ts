import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../database/prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuditContext, SYSTEM_CONTEXT } from './audit-context';
describe('AuditService', () => {
  const create = jest.fn(),
    outside = jest.fn(),
    error = jest.fn();
  const service = new AuditService(
    {
      auditLog: { create },
      recordAuditOutsideTransaction: outside,
    } as unknown as PrismaService,
    { error } as unknown as PinoLogger,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue({});
    outside.mockResolvedValue({});
  });
  it('conserva identidad, IP y request del contexto', async () => {
    await AuditContext.run(
      {
        ...SYSTEM_CONTEXT,
        userId: 'u',
        ip: '127.0.0.1',
        requestId: 'request',
        source: 'HTTP',
      },
      () => service.record({ action: 'LOGIN' }),
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u',
        ip: '127.0.0.1',
        requestId: 'request',
        source: 'HTTP',
      }) as unknown,
    });
  });
  it('el rechazo sobrevive fuera de transacción sin cambiar el error de acceso', async () => {
    outside.mockRejectedValue(new Error('db'));
    await expect(
      service.record({
        action: 'ACCESS_DENIED',
        outsideTransaction: true,
        requestId: 'r',
      }),
    ).resolves.toBeUndefined();
    expect(create).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });
  it('propaga errores en eventos normales', async () => {
    create.mockRejectedValue(new Error('db'));
    await expect(service.record({ action: 'LOGIN' })).rejects.toThrow('db');
  });
});
