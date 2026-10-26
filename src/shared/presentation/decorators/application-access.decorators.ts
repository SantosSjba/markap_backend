import { SetMetadata } from '@nestjs/common';
import type { AccessLevel } from '../../domain/access-level';
export type ApplicationRequirement =
  | string
  | string[]
  | { fromRequest: true; fallback: string[] };
export const APPLICATION_REQUIREMENT = 'application:requirement';
export const APPLICATION_SKIP = 'application:skip';
export const APPLICATION_LEVEL = 'application:level';
export const RequiresApplication = (requirement: ApplicationRequirement) =>
  SetMetadata(APPLICATION_REQUIREMENT, requirement);
export const SkipApplicationAccess = () => SetMetadata(APPLICATION_SKIP, true);
export const RequiresAccessLevel = (level: AccessLevel) =>
  SetMetadata(APPLICATION_LEVEL, level);
