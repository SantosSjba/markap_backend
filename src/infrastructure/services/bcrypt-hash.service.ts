import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashService } from '../../application/services/hash.service';

/**
 * Bcrypt Hash Service
 *
 * Implementación del servicio de hash usando bcrypt.
 */
@Injectable()
export class BcryptHashService implements HashService {
  private readonly SALT_ROUNDS = 10;

  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
