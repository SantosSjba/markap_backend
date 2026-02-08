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

export abstract class MenuRepository {
  /**
   * Obtiene los menús de una aplicación en estructura jerárquica (árbol)
   */
  abstract findByApplicationId(applicationId: string): Promise<MenuData[]>;
}
