import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../../../domain/repositories/role.repository';
@Injectable()
export class GetRoleApplicationsMatrixUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}
  execute() {
    return this.roles.getApplicationsMatrix();
  }
}
