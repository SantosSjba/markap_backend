/** Consultas de pertenencia y catálogos usadas al validar operaciones entre áreas. */
export type ProjectArea = 'interiorismo' | 'arquitectura';
export abstract class BusinessReferencePort {
  abstract projectCodeExists(
    area: ProjectArea,
    applicationId: string,
    code: string,
  ): Promise<boolean>;
  abstract findProjectScope(
    area: ProjectArea,
    id: string,
  ): Promise<{ applicationId: string } | null>;
  abstract projectExists(
    area: ProjectArea,
    applicationId: string,
    id: string,
  ): Promise<boolean>;
  abstract projectClientExists(
    applicationId: string,
    id: string,
  ): Promise<boolean>;
  abstract agentExists(applicationId: string, id: string): Promise<boolean>;
  abstract findApplicationBySlug(slug: string): Promise<{ id: string } | null>;
  abstract catalogCodeExists(
    area: ProjectArea | 'produccion',
    applicationId: string,
    code: string,
  ): Promise<boolean>;
  abstract catalogMaterialExists(
    area: ProjectArea,
    applicationId: string,
    id: string,
  ): Promise<boolean>;
  abstract supplierRucExists(
    area: ProjectArea,
    applicationId: string,
    ruc: string,
    excludeId?: string,
  ): Promise<boolean>;
  abstract findSupplierScope(
    area: ProjectArea,
    id: string,
  ): Promise<{ applicationId: string } | null>;
  abstract findSupplierLink(
    area: ProjectArea,
    id: string,
  ): Promise<{ supplier: { application: { slug: string } } } | null>;
  abstract currencyExists(code: string): Promise<boolean>;
  abstract findFinancingChannel(id: string): Promise<{ id: string } | null>;
}
