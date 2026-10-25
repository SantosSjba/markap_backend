import { Injectable } from '@nestjs/common';
import { CatalogQueryPort } from '../ports/catalog-query.port';
@Injectable()
export class CatalogQueriesService {
  constructor(private readonly catalog: CatalogQueryPort) {}
  documentTypes() {
    return this.catalog.documentTypes();
  }
  propertyTypes() {
    return this.catalog.propertyTypes();
  }
  currencies() {
    return this.catalog.currencies();
  }
  departments() {
    return this.catalog.departments();
  }
  provinces(departmentId?: string) {
    return this.catalog.provinces(departmentId);
  }
  districts(provinceId?: string) {
    return this.catalog.districts(provinceId);
  }
}
