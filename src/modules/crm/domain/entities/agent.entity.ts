export type AgentType = 'INTERNAL' | 'EXTERNAL';

/** Funciones que un integrante puede cubrir en proyectos de Interiorismo/Arquitectura. */
export const AGENT_PROJECT_ROLES = [
  'DESIGNER',
  'ARCHITECT_JR',
  'ARCHITECT_SR',
  'SUPERVISOR',
  'COMMERCIAL',
] as const;
export type AgentProjectRole = (typeof AGENT_PROJECT_ROLES)[number];

/** Agente comercial (interno o externo) por aplicación. */
export class Agent {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly type: AgentType,
    public readonly userId: string | null,
    public readonly fullName: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly documentTypeId: string | null,
    public readonly documentNumber: string | null,
    public readonly roles: AgentProjectRole[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Vista de listado / detalle con relaciones resumidas. */
export class AgentListItem {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly type: AgentType,
    public readonly userId: string | null,
    public readonly fullName: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly documentTypeId: string | null,
    public readonly documentNumber: string | null,
    public readonly roles: AgentProjectRole[],
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly user: {
      id: string;
      firstName: string;
      lastName: string;
    } | null,
    public readonly documentType: { code: string; name: string } | null,
  ) {}

  static fromAgent(
    agent: Agent,
    user: AgentListItem['user'],
    documentType: AgentListItem['documentType'],
  ): AgentListItem {
    return new AgentListItem(
      agent.id,
      agent.applicationId,
      agent.type,
      agent.userId,
      agent.fullName,
      agent.email,
      agent.phone,
      agent.documentTypeId,
      agent.documentNumber,
      agent.roles,
      agent.isActive,
      agent.createdAt,
      agent.updatedAt,
      user,
      documentType,
    );
  }
}
