import { Injectable } from '@nestjs/common';
import {
  BusinessReferencePort,
  type ProjectArea,
} from '../../application/ports/business-reference.port';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PrismaBusinessReferenceAdapter extends BusinessReferencePort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async projectCodeExists(
    area: ProjectArea,
    applicationId: string,
    code: string,
  ) {
    const args = {
      where: { applicationId, code, deletedAt: null },
      select: { id: true },
    };
    return !!(area === 'interiorismo'
      ? await this.prisma.interiorProject.findFirst(args)
      : await this.prisma.arquitecturaProject.findFirst(args));
  }
  findProjectScope(area: ProjectArea, id: string) {
    const args = {
      where: { id, deletedAt: null },
      select: { applicationId: true },
    };
    return area === 'interiorismo'
      ? this.prisma.interiorProject.findFirst(args)
      : this.prisma.arquitecturaProject.findFirst(args);
  }
  async projectExists(area: ProjectArea, applicationId: string, id: string) {
    const args = { where: { id, applicationId, deletedAt: null } };
    return (
      (area === 'interiorismo'
        ? await this.prisma.interiorProject.count(args)
        : await this.prisma.arquitecturaProject.count(args)) > 0
    );
  }
  async projectClientExists(applicationId: string, id: string) {
    return !!(await this.prisma.client.findFirst({
      where: {
        id,
        applicationId,
        deletedAt: null,
        clientType: { in: ['RESIDENTIAL', 'CORPORATE'] },
      },
      select: { id: true },
    }));
  }
  async agentExists(applicationId: string, id: string) {
    return !!(await this.prisma.agent.findFirst({
      where: { id, applicationId, deletedAt: null },
      select: { id: true },
    }));
  }
  findApplicationBySlug(slug: string) {
    return this.prisma.application.findUnique({
      where: { slug },
      select: { id: true },
    });
  }
  async catalogCodeExists(
    area: ProjectArea | 'produccion',
    applicationId: string,
    code: string,
  ) {
    const args = { where: { applicationId, code }, select: { id: true } };
    return !!(area === 'interiorismo'
      ? await this.prisma.interiorCatalogMaterial.findFirst(args)
      : area === 'arquitectura'
        ? await this.prisma.arquitecturaCatalogMaterial.findFirst(args)
        : await this.prisma.produccionFurniture.findFirst(args));
  }
  async catalogMaterialExists(
    area: ProjectArea,
    applicationId: string,
    id: string,
  ) {
    const args = { where: { id, applicationId }, select: { id: true } };
    return !!(area === 'interiorismo'
      ? await this.prisma.interiorCatalogMaterial.findFirst(args)
      : await this.prisma.arquitecturaCatalogMaterial.findFirst(args));
  }
  async supplierRucExists(
    area: ProjectArea,
    applicationId: string,
    ruc: string,
    excludeId?: string,
  ) {
    const args = {
      where: {
        applicationId,
        ruc,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    };
    return !!(area === 'interiorismo'
      ? await this.prisma.interiorMaterialSupplier.findFirst(args)
      : await this.prisma.arquitecturaMaterialSupplier.findFirst(args));
  }
  findSupplierScope(area: ProjectArea, id: string) {
    const args = { where: { id }, select: { applicationId: true } };
    return area === 'interiorismo'
      ? this.prisma.interiorMaterialSupplier.findUnique(args)
      : this.prisma.arquitecturaMaterialSupplier.findUnique(args);
  }
  findSupplierLink(area: ProjectArea, id: string) {
    const args = {
      where: { id },
      select: {
        supplier: { select: { application: { select: { slug: true } } } },
      },
    };
    return area === 'interiorismo'
      ? this.prisma.interiorSupplierCatalogLink.findUnique(args)
      : this.prisma.arquitecturaSupplierCatalogLink.findUnique(args);
  }
  async currencyExists(code: string) {
    return !!(await this.prisma.currency.findFirst({
      where: { code, isActive: true },
      select: { id: true },
    }));
  }
  findFinancingChannel(id: string) {
    return this.prisma.saleFinancingChannel.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });
  }
}
