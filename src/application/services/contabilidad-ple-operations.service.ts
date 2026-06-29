import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CONTABILIDAD_CONFIG_REPOSITORY,
  CONTABILIDAD_PLE_REPOSITORY,
} from '@common/constants/injection-tokens';
import { isValidPleBookCode } from '@domain/constants/contabilidad-ple.defaults';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ContabilidadConfigRepository } from '@domain/repositories/contabilidad-config.repository';
import type { ContabilidadPleRepository } from '@domain/repositories/contabilidad-ple.repository';
import { EntityNotFoundException } from '@domain/exceptions';

const CONTABILIDAD_SLUG = 'contabilidad';

function assertContabilidadSlug(slug: string | undefined | null) {
  if (slug?.trim() !== CONTABILIDAD_SLUG) {
    throw new BadRequestException('Esta operación solo aplica a Contabilidad (applicationSlug=contabilidad).');
  }
}

function mapRepoError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'Operación no válida.';
  throw new BadRequestException(message);
}

@Injectable()
export class ContabilidadPleOperationsService {
  constructor(
    @Inject(CONTABILIDAD_PLE_REPOSITORY)
    private readonly ple: ContabilidadPleRepository,
    @Inject(CONTABILIDAD_CONFIG_REPOSITORY)
    private readonly config: ContabilidadConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  private async resolveApplicationId(applicationSlug?: string): Promise<string> {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    const app = await this.applications.findBySlug(CONTABILIDAD_SLUG);
    if (!app) throw new EntityNotFoundException('Application', CONTABILIDAD_SLUG);
    return app.id;
  }

  private async resolveCompany(applicationId: string) {
    const profile = await this.config.getCompanyProfile(applicationId);
    if (!profile.ruc?.trim()) {
      throw new BadRequestException('Configure el RUC de la empresa en Configuración contable.');
    }
    return { ruc: profile.ruc.trim(), legalName: profile.legalName.trim() };
  }

  listBooks(applicationSlug?: string) {
    assertContabilidadSlug(applicationSlug ?? CONTABILIDAD_SLUG);
    return this.ple.listBooks();
  }

  async generateBook(applicationSlug: string | undefined, periodId: string, bookCode: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!periodId) throw new BadRequestException('periodId requerido');
    if (!isValidPleBookCode(bookCode)) {
      throw new BadRequestException(`Código de libro PLE inválido: ${bookCode}`);
    }
    const company = await this.resolveCompany(applicationId);
    try {
      return await this.ple.generateBook(applicationId, periodId, bookCode, company);
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async generateBooks(applicationSlug: string | undefined, periodId: string, bookCodes: string[]) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!periodId) throw new BadRequestException('periodId requerido');
    if (!bookCodes?.length) throw new BadRequestException('Seleccione al menos un libro');
    const company = await this.resolveCompany(applicationId);
    try {
      return await this.ple.generateBooks(applicationId, periodId, bookCodes, company);
    } catch (e) {
      return mapRepoError(e);
    }
  }

  async getLibroMayor(applicationSlug?: string, periodId?: string, accountId?: string) {
    const applicationId = await this.resolveApplicationId(applicationSlug);
    if (!periodId) throw new BadRequestException('periodId requerido');
    try {
      const accounts = await this.ple.getLibroMayor(applicationId, periodId, accountId);
      return { accounts };
    } catch (e) {
      return mapRepoError(e);
    }
  }
}
