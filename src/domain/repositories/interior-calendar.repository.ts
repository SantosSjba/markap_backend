export type InteriorCalendarFeedSource = 'MANUAL' | 'MILESTONE' | 'EXECUTION_TASK' | 'FINANCE_SCHEDULE';

export interface InteriorCalendarFeedItemDto {
  id: string;
  source: InteriorCalendarFeedSource;
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

export interface InteriorCalendarFeedFilters {
  applicationSlug: string;
  from: Date;
  to: Date;
  projectId?: string;
  agentId?: string;
}

export interface CreateInteriorCalendarEventPayload {
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

export interface UpdateInteriorCalendarEventPayload {
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

export interface InteriorCalendarRepository {
  resolveApplicationId(slug: string): Promise<string | null>;
  ensureManualEventScope(eventId: string, applicationSlug: string): Promise<boolean>;
  getFeed(filters: InteriorCalendarFeedFilters): Promise<InteriorCalendarFeedItemDto[]>;
  createEvent(payload: CreateInteriorCalendarEventPayload): Promise<InteriorCalendarFeedItemDto>;
  updateEvent(
    eventId: string,
    applicationSlug: string,
    payload: UpdateInteriorCalendarEventPayload,
  ): Promise<InteriorCalendarFeedItemDto>;
  deleteEvent(eventId: string, applicationSlug: string): Promise<void>;
}

export const INTERIOR_CALENDAR_REPOSITORY = Symbol('InteriorCalendarRepository');
