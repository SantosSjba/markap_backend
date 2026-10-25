import { Injectable } from '@nestjs/common';
import { CatalogQueryPort } from '../../application/ports/catalog-query.port';
import { PrismaService } from '../database/prisma/prisma.service';
@Injectable()
export class PrismaCatalogQueryAdapter extends CatalogQueryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  documentTypes() {
    return this.prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
  propertyTypes() {
    return this.prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
  currencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, symbol: true },
    });
  }
  departments() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }
  provinces(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};
    return this.prisma.province.findMany({ where, orderBy: { name: 'asc' } });
  }
  districts(provinceId?: string) {
    const where = provinceId ? { provinceId } : {};
    return this.prisma.district.findMany({
      where,
      include: {
        province: {
          include: { department: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
