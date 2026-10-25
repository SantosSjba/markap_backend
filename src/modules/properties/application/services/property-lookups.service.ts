import { Injectable } from '@nestjs/common';
import { PropertyLookupPort } from '../ports/property-lookup.port';
@Injectable()
export class PropertyLookupsService {
  constructor(private readonly lookup: PropertyLookupPort) {}
  owners(applicationSlug?: string, search?: string) {
    return this.lookup.owners(applicationSlug, search);
  }
}
