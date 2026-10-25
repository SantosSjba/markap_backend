export interface PropertyOwnerOption {
  id: string;
  fullName: string;
  documentNumber: string;
  primaryPhone: string;
  primaryEmail: string | null;
}
export abstract class PropertyLookupPort {
  abstract owners(
    applicationSlug?: string,
    search?: string,
  ): Promise<PropertyOwnerOption[]>;
  abstract applicationSlug(applicationId: string): Promise<string | null>;
}
