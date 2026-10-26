import type { AccessLevel } from '../../../../shared/domain/access-level';
export interface AccessAssignment {
  slug: string;
  applicationId: string;
  name: string;
  level: AccessLevel;
}
export abstract class ApplicationAccessRepository {
  abstract resolveResourceApplication(
    resource: string,
    id: string,
  ): Promise<string | null>;
  abstract getAssignments(userId: string): Promise<AccessAssignment[]>;
}
