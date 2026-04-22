import type {
  ListAgentsFilters,
  ListAgentsResult,
  AgentListItem,
} from '@domain/repositories/agent.repository';
import type { CreateAgentInput } from '../use-cases/agents/create-agent.use-case';
import type { UpdateAgentInput } from '../use-cases/agents/update-agent.use-case';

export const AGENT_PORT = Symbol('AgentPort');

/**
 * Fachada de la aplicación para el recurso **Agents** (entrada hacia use-cases).
 * Los controladores dependen de esta interfaz, no de casos de uso concretos.
 */
export interface AgentPort {
  listAgents(filters: ListAgentsFilters): Promise<ListAgentsResult>;
  createAgent(input: CreateAgentInput): Promise<unknown>;
  getAgentById(
    id: string,
    opts?: { applicationSlug?: string },
  ): Promise<AgentListItem>;
  updateAgent(
    id: string,
    data: UpdateAgentInput,
    applicationSlug?: string,
  ): Promise<unknown>;
  deleteAgent(id: string, applicationSlug?: string): Promise<unknown>;
}
