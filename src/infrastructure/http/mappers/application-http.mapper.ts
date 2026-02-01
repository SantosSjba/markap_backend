import { Application } from '../../../application/entities';
import { ApplicationResponseDto } from '../dtos/applications';

/**
 * Application HTTP Mapper
 * Maps Application entity to HTTP response DTOs
 */
export class ApplicationHttpMapper {
  static toResponse(application: Application): ApplicationResponseDto {
    return {
      id: application.id,
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
    return applications.map(this.toResponse);
  }
}
