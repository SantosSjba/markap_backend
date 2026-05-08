import {
  InteriorismoNumberingSeries,
  InteriorismoProjectStage,
} from '@domain/entities/interiorismo-config.entity';

export class InteriorismoConfigPrismaMapper {
  static toProjectStage(r: {
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): InteriorismoProjectStage {
    return new InteriorismoProjectStage(r.code, r.label, r.sortOrder, r.isActive);
  }

  static toNumberingSeries(r: {
    seriesKey: string;
    prefix: string;
    lastNumber: number;
  }): InteriorismoNumberingSeries {
    return new InteriorismoNumberingSeries(r.seriesKey, r.prefix, r.lastNumber);
  }
}
