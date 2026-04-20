import { Agent, AgentListItem, type AgentType } from '@domain/entities/agent.entity';

type AgentBaseRow = {
  id: string;
  applicationId: string;
  type: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  documentTypeId: string | null;
  documentNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AgentListRow = AgentBaseRow & {
  user?: { id: string; firstName: string; lastName: string } | null;
  documentType?: { code: string; name: string } | null;
};

export class AgentPrismaMapper {
  static toDomain(row: AgentBaseRow): Agent {
    return new Agent(
      row.id,
      row.applicationId,
      row.type as AgentType,
      row.userId,
      row.fullName,
      row.email,
      row.phone,
      row.documentTypeId,
      row.documentNumber,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }

  static toListItem(row: AgentListRow): AgentListItem {
    const user = row.user
      ? { id: row.user.id, firstName: row.user.firstName, lastName: row.user.lastName }
      : null;
    const documentType = row.documentType
      ? { code: row.documentType.code, name: row.documentType.name }
      : null;
    return new AgentListItem(
      row.id,
      row.applicationId,
      row.type as AgentType,
      row.userId,
      row.fullName,
      row.email,
      row.phone,
      row.documentTypeId,
      row.documentNumber,
      row.isActive,
      row.createdAt,
      row.updatedAt,
      user,
      documentType,
    );
  }
}
