export type ArquitecturaCalendarFeedSource = 'MANUAL' | 'MILESTONE' | 'EXECUTION_TASK' | 'FINANCE_SCHEDULE';

export interface ArquitecturaCalendarFeedItemDto {
  id: string;
  source: ArquitecturaCalendarFeedSource;
  /** Manual: MEETING | VISIT | INSTALLATION | DEADLINE | TEAM_BLOCK. Derivados: MILESTONE | TASK_* | FINANCE_DUE */
  eventType: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  readOnly: boolean;
  executionPhase: string | null;
}

export interface ArquitecturaCalendarFeedFilters {
  applicationSlug: string;
  from: Date;
  to: Date;
  projectId?: string;
  agentId?: string;
}

export interface CreateArquitecturaCalendarEventPayload {
  applicationId: string;
  projectId?: string | null;
  eventType: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  assignedAgentId?: string | null;
}

export interface UpdateArquitecturaCalendarEventPayload {
  projectId?: string | null;
  eventType?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: Date;
  endsAt?: Date | null;
  allDay?: boolean;
  assignedAgentId?: string | null;
}

export interface ArquitecturaCalendarRepository {
  resolveApplicationId(slug: string): Promise<string | null>;
  ensureManualEventScope(eventId: string, applicationSlug: string): Promise<boolean>;
  getFeed(filters: ArquitecturaCalendarFeedFilters): Promise<ArquitecturaCalendarFeedItemDto[]>;
  createEvent(payload: CreateArquitecturaCalendarEventPayload): Promise<ArquitecturaCalendarFeedItemDto>;
  updateEvent(
    eventId: string,
    applicationSlug: string,
    payload: UpdateArquitecturaCalendarEventPayload,
  ): Promise<ArquitecturaCalendarFeedItemDto>;
  deleteEvent(eventId: string, applicationSlug: string): Promise<void>;
}

export const ARQUITECTURA_CALENDAR_REPOSITORY = Symbol('ArquitecturaCalendarRepository');
