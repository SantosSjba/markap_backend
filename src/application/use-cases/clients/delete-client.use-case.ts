import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ClientRepository } from '../../repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../repositories/client.repository';
import type { RentalRepository } from '../../repositories/rental.repository';
import { RENTAL_REPOSITORY } from '../../repositories/rental.repository';
import { EntityNotFoundException } from '../../exceptions';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(RENTAL_REPOSITORY)
    private readonly rentalRepository: RentalRepository,
  ) {}

  async execute(id: string): Promise<{ message: string }> {
    const client = await this.clientRepository.findById(id);
    if (!client) throw new EntityNotFoundException('Client', id);
    const activeRentals = await this.rentalRepository.countActiveInvolvingClient(id);
    if (activeRentals > 0) {
      throw new BadRequestException(
        'No se puede eliminar el cliente mientras sea inquilino o propietario en un contrato de alquiler vigente.',
      );
    }
    await this.clientRepository.softDelete(id);
    return { message: 'Cliente eliminado correctamente' };
  }
}
