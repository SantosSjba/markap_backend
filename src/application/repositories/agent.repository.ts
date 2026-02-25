export type AgentType = 'INTERNAL' | 'EXTERNAL';

export interface AgentData {
  id: string;
  applicationId: string;
  type: AgentType;
  userId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  documentTypeId: string | null;
  documentNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentListItem extends AgentData {
  user?: { id: string; firstName: string; lastName: string } | null;
  documentType?: { code: string; name: string } | null;
}

export interface CreateAgentData {
  applicationId: string;
  type: AgentType;
  userId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  documentTypeId?: string | null;
  documentNumber?: string | null;
}

export interface UpdateAgentData {
  type?: AgentType;
  userId?: string | null;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  documentTypeId?: string | null;
  documentNumber?: string | null;
  isActive?: boolean;
}

export interface ListAgentsFilters {
  applicationSlug: string;
  page: number;
  limit: number;
  search?: string;
  type?: AgentType;
  isActive?: boolean;
}

export interface ListAgentsResult {
  data: AgentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AgentRepository {
  create(data: CreateAgentData): Promise<AgentData>;
  findById(id: string): Promise<AgentListItem | null>;
  findMany(filters: ListAgentsFilters): Promise<ListAgentsResult>;
  update(id: string, data: UpdateAgentData): Promise<AgentData>;
}

export const AGENT_REPOSITORY = Symbol('AgentRepository');
