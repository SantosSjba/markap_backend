import type { AccessLevel } from '../../domain/access-level';
export interface ApplicationLevel {
  level: AccessLevel;
  applicationId: string;
  name: string;
}
export interface ApplicationAccess {
  resolveResourceApplication(
    resource: string,
    id: string,
  ): Promise<string | null>;
  getLevels(userId: string): Promise<Map<string, ApplicationLevel>>;
  invalidate(userId?: string): void;
}
export const APPLICATION_ACCESS = Symbol('APPLICATION_ACCESS');
let revision = 0;
export const accessRevision = () => revision;
export const invalidateAccessCache = () => {
  revision++;
};
