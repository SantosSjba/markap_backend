import { BadRequestException } from '@nestjs/common';
import type { BusinessReferencePort } from '../ports/business-reference.port';
import { assertAgentsBelongToApplication } from './assert-agents-belong-to-application';

describe('validación compartida de responsables', () => {
  it('omite campos vacíos y valida una vez cada responsable con el ámbito correcto', async () => {
    const agentExists = jest.fn().mockResolvedValue(true);
    await assertAgentsBelongToApplication(
      { agentExists } as unknown as BusinessReferencePort,
      'app-1',
      [null, undefined, '', ' ', 'agent-1', 'agent-1'],
    );
    expect(agentExists).toHaveBeenCalledTimes(1);
    expect(agentExists).toHaveBeenCalledWith('app-1', 'agent-1');
  });
  it('rechaza responsables que no pertenecen al ámbito de la operación', async () => {
    const agentExists = jest.fn().mockResolvedValue(false);
    await expect(
      assertAgentsBelongToApplication(
        { agentExists } as unknown as BusinessReferencePort,
        'app-1',
        ['foreign-agent'],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
