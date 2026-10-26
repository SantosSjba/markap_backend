import { Application } from '../../domain/entities/application.entity';
import { ApplicationResponseDto } from '../dtos/applications/application-response.dto';

/**
 * Application HTTP Mapper
 * Maps Application entity to HTTP response DTOs
 */
export class ApplicationHttpMapper {
  static toResponse(application: Application): ApplicationResponseDto {
    return {
      id: application.id,
      accessLevel: application.accessLevel,
      name: application.name,
      slug: application.slug,
      description: application.description,
      icon: application.icon,
      color: application.color,
      url: application.url,
      activeCount: application.activeCount,
      pendingCount: application.pendingCount,
      order: application.order,
    };
  }

  static toResponseList(applications: Application[]): ApplicationResponseDto[] {
    return applications.map((row) => this.toResponse(row));
  }
}
