import type {
  Agent,
  AgentListItem,
  AgentProjectRole,
  AgentType,
} from '../entities/agent.entity';

export type {
  Agent,
  AgentListItem,
  AgentProjectRole,
  AgentType,
} from '../entities/agent.entity';

export interface CreateAgentData {
  applicationId: string;
  type: AgentType;
  userId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentTypeId?: string | null;
  documentNumber?: string | null;
  roles?: AgentProjectRole[];
}

export interface UpdateAgentData {
  type?: AgentType;
  userId?: string | null;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  documentTypeId?: string | null;
  documentNumber?: string | null;
  roles?: AgentProjectRole[];
  isActive?: boolean;
}

export interface ListAgentsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  type?: AgentType;
  /** Solo integrantes que cubren esta función */
  role?: AgentProjectRole;
  isActive?: boolean;
}

export interface ListAgentsResult {
  data: AgentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AgentRepository {
  create(data: CreateAgentData): Promise<Agent>;
  findById(id: string): Promise<AgentListItem | null>;
  findMany(filters: ListAgentsFilters): Promise<ListAgentsResult>;
  update(id: string, data: UpdateAgentData): Promise<Agent>;
  softDelete(id: string): Promise<void>;
}

export const AGENT_REPOSITORY = Symbol('AgentRepository');
