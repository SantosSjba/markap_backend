import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  APPLICATION_ACCESS,
  type ApplicationAccess,
} from '../../application/ports/application-access.port';
import {
  AUDIT_RECORDER,
  type AuditRecorder,
} from '../../application/ports/audit-recorder.port';
import { levelAllows, type AccessLevel } from '../../domain/access-level';
import {
  APPLICATION_REQUIREMENT,
  APPLICATION_SKIP,
  APPLICATION_LEVEL,
  type ApplicationRequirement,
} from '../decorators/application-access.decorators';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard';
@Injectable()
export class ApplicationAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtAuthGuard,
    @Inject(APPLICATION_ACCESS) private readonly access: ApplicationAccess,
    @Inject(AUDIT_RECORDER) private readonly audit: AuditRecorder,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(APPLICATION_SKIP, targets))
      return true;
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user) await this.jwt.canActivate(ctx);
    const levels = await this.access.getLevels(req.user.sub);
    const requirement =
      this.reflector.getAllAndOverride<ApplicationRequirement>(
        APPLICATION_REQUIREMENT,
        targets,
      );
    const required =
      this.reflector.getAllAndOverride<AccessLevel>(
        APPLICATION_LEVEL,
        targets,
      ) ??
      (['GET', 'HEAD', 'OPTIONS'].includes(req.method)
        ? 'READ'
        : req.method === 'DELETE'
          ? 'ADMIN'
          : 'WRITE');
    let slugs: string[] = [];
    if (typeof requirement === 'string') slugs = [requirement];
    else if (Array.isArray(requirement)) slugs = requirement;
    else if (requirement?.fromRequest) {
      const query = req.query as Record<string, unknown>;
      const body = req.body as Record<string, unknown> | undefined;
      if (typeof query.applicationSlug === 'string')
        slugs = [query.applicationSlug];
      else {
        const id = body?.applicationId ?? query.applicationId;
        slugs =
          id !== undefined
            ? [...levels]
                .filter(([, l]) => l.applicationId === id)
                .map(([slug]) => slug)
            : requirement.fallback;
      }
    }
    // En recursos compartidos, el id de la fila manda sobre un slug enviado por el cliente.
    const resourcePath = Reflect.getMetadata('path', ctx.getClass()) as string;
    if (
      ['clients', 'properties', 'agents'].includes(resourcePath) &&
      typeof requirement === 'object' &&
      !Array.isArray(requirement) &&
      requirement.fromRequest &&
      req.params?.id
    ) {
      const resource = resourcePath;
      const applicationId = await this.access.resolveResourceApplication(
        resource,
        String(req.params.id),
      );
      const resourceSlug = [...levels].find(
        ([, l]) => l.applicationId === applicationId,
      )?.[0];
      if (!resourceSlug || !slugs.includes(resourceSlug)) slugs = [];
      else slugs = [resourceSlug];
    }
    const granted = slugs
      .map((s) => levels.get(s))
      .find((l) => l && levelAllows(l.level, required));
    if (granted) return true;
    const appSlug = slugs[0] ?? null;
    const app = appSlug ? levels.get(appSlug) : undefined;
    await this.audit.record({
      action: 'ACCESS_DENIED',
      userId: req.user.sub,
      outsideTransaction: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: typeof req.id === 'string' ? req.id : null,
      metadata: {
        method: req.method,
        path: req.path,
        appSlug,
        required,
        granted: app?.level ?? null,
      },
    });
    throw new ForbiddenException(
      `No tienes permiso para esta acción en ${app?.name ?? appSlug ?? 'esta aplicación'}`,
    );
  }
}
