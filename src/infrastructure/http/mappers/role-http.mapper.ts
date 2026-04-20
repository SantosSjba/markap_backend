import { Role } from '@domain/entities/role.entity';

/** Respuesta resumida en listados de roles (GET /roles). */
export type RoleListItemResponse = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
};

/** Detalle de rol (GET /roles/:id). */
export type RoleDetailResponse = RoleListItemResponse & {
  createdAt: Date;
  updatedAt: Date;
};

export class RoleHttpMapper {
  static toListItem(role: Role): RoleListItemResponse {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
    };
  }

  static toDetail(role: Role): RoleDetailResponse {
    return {
      ...RoleHttpMapper.toListItem(role),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
