export interface NamedCatalogItem {
  id: string;
  name: string;
}
export interface ActiveCatalogItem extends NamedCatalogItem {
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface DocumentTypeItem extends ActiveCatalogItem {
  length: number | null;
}
export interface ProvinceItem extends NamedCatalogItem {
  departmentId: string;
}
export interface DistrictItem extends NamedCatalogItem {
  provinceId: string;
  province: ProvinceItem & { department: NamedCatalogItem };
}
export interface CurrencyItem extends NamedCatalogItem {
  code: string;
  symbol: string;
}
export abstract class CatalogQueryPort {
  abstract documentTypes(): Promise<DocumentTypeItem[]>;
  abstract propertyTypes(): Promise<ActiveCatalogItem[]>;
  abstract currencies(): Promise<CurrencyItem[]>;
  abstract departments(): Promise<NamedCatalogItem[]>;
  abstract provinces(departmentId?: string): Promise<ProvinceItem[]>;
  abstract districts(provinceId?: string): Promise<DistrictItem[]>;
}
