import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PersistenceErrorPort } from '../../application/ports/persistence-error.port';
@Injectable()
export class PrismaErrorAdapter extends PersistenceErrorPort {
  isKnown(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError;
  }
  isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
