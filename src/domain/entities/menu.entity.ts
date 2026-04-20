/** Ítem de menú jerárquico por aplicación. */
export class Menu {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly parentId: string | null,
    public readonly label: string,
    public readonly icon: string | null,
    public readonly path: string | null,
    public readonly order: number,
    public readonly isActive: boolean,
    public readonly children: Menu[] | undefined,
  ) {}

  static leaf(
    id: string,
    applicationId: string,
    parentId: string | null,
    label: string,
    icon: string | null,
    path: string | null,
    order: number,
    isActive: boolean,
  ): Menu {
    return new Menu(id, applicationId, parentId, label, icon, path, order, isActive, undefined);
  }

  withChildren(children: Menu[]): Menu {
    return new Menu(
      this.id,
      this.applicationId,
      this.parentId,
      this.label,
      this.icon,
      this.path,
      this.order,
      this.isActive,
      children,
    );
  }
}
