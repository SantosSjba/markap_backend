/**
 * Menu Repository Interface
 *
 * Define el contrato para gestionar menús de aplicaciones.
 */
export interface MenuData {
  id: string;
  applicationId: string;
  parentId: string | null;
  label: string;
  icon: string | null;
  path: string | null;
  order: number;
  isActive: boolean;
  children?: MenuData[];
}

export interface CreateMenuData {
  applicationId: string;
  parentId?: string | null;
  label: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
}

export interface UpdateMenuData {
  parentId?: string | null;
  label?: string;
  icon?: string | null;
  path?: string | null;
  order?: number;
  isActive?: boolean;
}

export abstract class MenuRepository {
  /**
   * Obtiene los menús de una aplicación en estructura jerárquica (árbol)
   */
  abstract findByApplicationId(applicationId: string): Promise<MenuData[]>;

  /**
   * Obtiene todos los menús de una aplicación (lista plana, incluye inactivos)
   */
  abstract findAllByApplicationId(applicationId: string): Promise<MenuData[]>;

  /**
   * Busca un menú por ID
   */
  abstract findById(id: string): Promise<MenuData | null>;

  /**
   * Crea un nuevo menú
   */
  abstract create(data: CreateMenuData): Promise<MenuData>;

  /**
   * Actualiza un menú
   */
  abstract update(id: string, data: UpdateMenuData): Promise<MenuData>;

  /**
   * Elimina un menú
   */
  abstract delete(id: string): Promise<void>;
}
