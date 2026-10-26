# Acceso por rol y aplicación + auditoría completa — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar toda escritura y evento sensible en `audit_logs` (con quién y cuándo en cada tabla) y aplicar un nivel de acceso `READ | WRITE | ADMIN` por rol y aplicación en el router y en la API.

**Architecture:**
- Un `AsyncLocalStorage` (`AuditContext`) lleva el usuario de cada request.
- Una extensión `$extends` de Prisma, conectada dentro de `PrismaService`, completa `createdBy/updatedBy` y escribe `audit_logs` en la misma transacción que la escritura.
- Un guard global (`ApplicationAccessGuard`) resuelve la app de cada controlador por decorador y exige el nivel según el método HTTP.
- El frontend agrega una pantalla de Auditoría, un selector de nivel en la matriz de roles y aplicaciones, y un guard de router por `meta.applicationSlug`.

**Tech Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`, PostgreSQL), Jest 30 + ts-jest, Vue 3 + vue-router + TanStack Query, Tailwind (TailAdmin).

**Spec:** `markap_backend/docs/superpowers/specs/2026-10-25-acceso-por-app-y-auditoria-design.md`

## Global Constraints

- Niveles: `READ`, `WRITE`, `ADMIN`. Sin fila en `role_applications` = sin acceso. El rol con `code === 'ADMIN'` tiene `ADMIN` en todas las apps activas.
- Varios roles → el **máximo** nivel entre roles activos (`role.isActive`, `role.deletedAt = null`, `userRole.isActive`, `userRole.revokedAt = null`).
- Nivel por método: `GET/HEAD` → `READ`; `POST/PUT/PATCH` → `WRITE`; `DELETE` → `ADMIN`.
- Mensaje 403: `No tienes permiso para esta acción en <Nombre de la app>`.
- Acciones de auditoría (string exacto): `CREATE`, `UPDATE`, `DELETE`, `SOFT_DELETE`, `RESTORE`, `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET`, `ACCESS_DENIED`.
- `source` de auditoría: `HTTP`, `WS`, `JOB`, `SEED`, `SYSTEM` (este último por defecto fuera de contexto).
- Modelos excluidos del gancho y de las columnas de trazabilidad: `AuditLog`, `ContabilidadAuditLog`, `Notification`, `PasswordResetCode`.
- Valor de enmascarado: el string `"***"`.
- `updateMany`/`deleteMany` con más de **1000** filas afectadas → **una** fila resumen con `metadata: { count, where }`.
- Caché de niveles: TTL de **30 s** por `userId`, invalidada al cambiar `role_applications` o `user_roles`.
- La migración de `role_applications` deja **todas** las filas existentes en `WRITE`.
- `audit_logs` es inmutable: un trigger rechaza `UPDATE` y `DELETE`.
- Sin FK de `audit_logs.user_id`, `created_by` ni `updated_by` hacia `users`.
- Comentarios y textos de UI en español, siguiendo el estilo del repo. Comandos backend con `pnpm` desde `markap_backend/`; los del frontend, desde `markap_frontend/`.

## Review Focus

1. **Escritura dentro de `atomic()` que falla después de escribir** → el cambio y su log se revierten juntos; no quedan logs huérfanos. Test en la Tarea 4.
2. **Usuario con dos roles (`READ` en uno, `WRITE` en otro)** → puede editar; si se le quita el rol de edición, a los ≤30 s solo lee. Tests en la Tarea 9.
3. **Endpoint compartido sin `applicationSlug`/`applicationId`** (por ejemplo `GET /clients/departments`) → pasa si tiene acceso a `alquileres` o a `ventas`; si no, 403. Test en la Tarea 10.
4. **`update` que solo toca `updatedAt`** (el caso de uso guarda sin cambios reales) → no genera un `UPDATE` vacío en el log. Test en la Tarea 4.
5. **Cambio de contraseña o de credenciales SOL** → el log indica que el campo cambió, pero nunca guarda el valor, ni antes ni después. Tests en las Tareas 2 y 4.

---

## Estructura de archivos

**Backend — nuevos:**
- `src/shared/infrastructure/audit/audit-context.ts`: ALS y servicio `AuditContext`.
- `src/shared/infrastructure/audit/audit-context.interceptor.ts`: interceptor HTTP que llena el contexto.
- `src/shared/infrastructure/audit/audit-diff.ts`: funciones puras de diff, enmascarado y clasificación.
- `src/shared/infrastructure/audit/audit-sensitive-fields.ts`: lista central de campos sensibles.
- `src/shared/infrastructure/audit/prisma-audit.extension.ts`: extensión `$extends`.
- `src/shared/infrastructure/audit/audit.service.ts`: `AuditService.record` para eventos.
- `src/shared/infrastructure/audit/audit.module.ts`: módulo global que exporta `AuditContext` y `AuditService` y registra el interceptor.
- `src/modules/identity/...audit-logs`: use cases, repositorio y controlador de lectura (Tarea 6).
- `src/modules/identity/application/services/application-access.service.ts`: niveles efectivos y caché.
- `src/shared/presentation/guards/application-access.guard.ts` y `src/shared/presentation/decorators/application-access.decorators.ts`.
- `prisma/models/audit.prisma`.
- `prisma/scripts/add-trace-fields.mjs`: codemod de un solo uso.
- `test/jest-int.json` y `test/int/*.int-spec.ts`: tests de integración contra la base.

**Backend — modificados:** `prisma.service.ts`, `app.module.ts`, `admin.guard.ts`, `auth.controller.ts` y los casos de uso de auth, `applications.prisma`, el repositorio de roles y aplicaciones, `roles.controller.ts`, `menus.controller.ts`, todos los controladores de negocio (decorador), `prisma/seed/steps/roles-applications.ts`, `eslint.config.mjs` y `package.json`.

**Frontend — nuevos:**
- `src/modules/settings/.../AuditLogsView.vue` (con repositorio, port y composable siguiendo el patrón de `role-applications`).
- `src/modules/applications/presentation/composables/useApplicationAccess.ts`.
- `src/app/router/guards/application-access.guard.ts`.
- `tests/application-access.test.ts`.

**Frontend — modificados:** `RoleApplicationsView.vue` y su repositorio, composable y tipos; las rutas raíz de las 6 apps (`meta.applicationSlug`); `tests/contracts/routes.json`; `tests/run.mjs`; `ApplicationsView.vue` (badge); el logout del store de auth; y los listados de cada app (botones según nivel).

---

# Fase 1 — Auditoría

### Task 1: Contexto de auditoría por request

**Files:**
- Create: `src/shared/infrastructure/audit/audit-context.ts`
- Create: `src/shared/infrastructure/audit/audit-context.interceptor.ts`
- Create: `src/shared/infrastructure/audit/audit.module.ts`
- Modify: `src/app.module.ts` (importar `AuditModule`)
- Test: `src/shared/infrastructure/audit/audit-context.spec.ts`

**Interfaces:**
- Produces:
  - `interface AuditContextData { userId: string | null; requestId: string | null; ip: string | null; userAgent: string | null; source: 'HTTP' | 'WS' | 'JOB' | 'SEED' | 'SYSTEM' }`
  - `const SYSTEM_CONTEXT: AuditContextData`
  - `class AuditContext { static get(): AuditContextData; static run<T>(data: AuditContextData, fn: () => T): T }`. Es estático para que la extensión de Prisma lo use sin inyección.
  - `AuditContextInterceptor` (`APP_INTERCEPTOR`)

- [ ] **Step 1: Escribir los tests que fallan**
  - `get() fuera de contexto devuelve SYSTEM_CONTEXT`: `userId === null` y `source === 'SYSTEM'`.
  - `run() expone los datos dentro de fn, también tras un await`.
  - `el interceptor toma userId de req.user.sub, ip de req.ip, userAgent del header y requestId de req.id`: probar con un `ExecutionContext` falso y `CallHandler` cuyo `handle()` lee `AuditContext.get()`.
- [ ] **Step 2: Correr** `pnpm jest src/shared/infrastructure/audit/audit-context.spec.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar.** El interceptor envuelve el `Observable` en `AuditContext.run(...)`: `new Observable(sub => AuditContext.run(data, () => next.handle().subscribe(sub)))`. Para requests no-HTTP (`context.getType() !== 'http'`) usa `source: 'WS'` y `userId` de `client.data.user?.sub` si existe. `AuditModule` es `@Global()` y registra el interceptor con `APP_INTERCEPTOR`.
- [ ] **Step 4: Contexto fuera de HTTP.**
  - Envolver el cuerpo de cada tarea programada (`grep -rn "@Cron\|@Interval\|@Timeout" src`, por ejemplo `rental-alerts.scheduler.ts`) en `AuditContext.run({ ...SYSTEM_CONTEXT, source: 'JOB' }, ...)`.
  - Envolver el `main()` de `prisma/seed.ts` y de `prisma/seed-prod.ts` con `source: 'SEED'`.
  - Agregar a `rental-alerts.scheduler.spec.ts` el caso `el job corre con source JOB`.
- [ ] **Step 5: Correr** los tests → PASS. Correr `pnpm typecheck` → sin errores.
- [ ] **Step 6: Commit** `feat(audit): contexto de auditoría por request`

### Task 2: Diff, enmascarado y clasificación (funciones puras)

**Files:**
- Create: `src/shared/infrastructure/audit/audit-sensitive-fields.ts`
- Create: `src/shared/infrastructure/audit/audit-diff.ts`
- Test: `src/shared/infrastructure/audit/audit-diff.spec.ts`

**Interfaces:**
- Produces:
  - `isSensitiveField(model: string, field: string): boolean`
  - `maskRecord(model: string, row: Record<string, unknown>): Record<string, unknown>`
  - `diffRecords(model: string, before: Record<string, unknown>, after: Record<string, unknown>): Record<string, { before: unknown; after: unknown }>`: ya enmascarado; ignora `updatedAt` y `updatedBy`.
  - `classifyUpdate(changes): 'UPDATE' | 'SOFT_DELETE' | 'RESTORE'`
  - `toJsonSafe(value: unknown): unknown`: convierte `Decimal` y `Date` a string y `bigint` a string.

- [ ] **Step 1: Revisar los campos sensibles reales.** Leer `prisma/models/contabilidad-sol.prisma`, `contabilidad-cpe.prisma` y `auth.prisma`, y escribir en `audit-sensitive-fields.ts`:
  - `SENSITIVE_FIELDS_BY_MODEL`: por ejemplo `PasswordResetCode: ['code']`, más los campos de credenciales SOL y CPE que existan.
  - `SENSITIVE_NAME_PATTERN = /password|secret|token|apikey|certificate/i`
- [ ] **Step 2: Escribir los tests que fallan**
  - `maskRecord('User', { email: 'a@b.c', password: 'x' })` → `{ email: 'a@b.c', password: '***' }`
  - `diffRecords('User', { password: 'a', firstName: 'A' }, { password: 'b', firstName: 'A' })` → `{ password: { before: '***', after: '***' } }`
  - `diffRecords` ignora `updatedAt` y `updatedBy`: si solo cambian ellos, devuelve `{}`.
  - `diffRecords` no marca cambio entre `Decimal('10.50')` y `Decimal('10.5')`, ni entre dos `Date` con el mismo instante; tampoco entre JSON con las mismas claves en otro orden.
  - `classifyUpdate({ deletedAt: { before: null, after: '2026-…' } })` → `'SOFT_DELETE'`; de un valor a `null` → `'RESTORE'`; si cambia `deletedAt` junto con otros campos → `'SOFT_DELETE'`, y en cualquier otro caso `'UPDATE'`.
- [ ] **Step 3: Correr** `pnpm jest src/shared/infrastructure/audit/audit-diff.spec.ts` → FAIL.
- [ ] **Step 4: Implementar** las funciones. La comparación profunda se hace sobre `toJsonSafe(...)`, con las claves ordenadas.
- [ ] **Step 5: Correr** el test → PASS.
- [ ] **Step 6: Commit** `feat(audit): diff y enmascarado de cambios`

### Task 3: Esquema — `audit_logs`, trigger inmutable y columnas de trazabilidad

**Files:**
- Create: `prisma/models/audit.prisma` (modelo `AuditLog` exacto de la spec §4.2)
- Create: `prisma/scripts/add-trace-fields.mjs`
- Modify: todos los `prisma/models/*.prisma` (lo hace el codemod)
- Create: `prisma/migrations/<timestamp>_audit_trail/migration.sql`
- Create: `test/jest-int.json`, `test/int/setup-int-db.ts`, `test/int/audit-schema.int-spec.ts`
- Modify: `package.json` (script `"test:int": "jest --config ./test/jest-int.json --runInBand"`)

**Interfaces:**
- Produces:
  - `prisma.auditLog` con los campos de la spec §4.2.
  - Todo modelo de negocio con `createdAt`, `updatedAt`, `createdBy String?` y `updatedBy String?`.
  - Helper de test `withIntDb(): PrismaService`: usa `TEST_DATABASE_URL`; el suite hace `describe.skip` si no está definida.

- [ ] **Step 1: Escribir el codemod** `add-trace-fields.mjs`. Para cada bloque `model X { ... }` en `prisma/models/*.prisma`, salvo los excluidos (Global Constraints), agrega lo que falte:
  - `createdAt DateTime @default(now()) @map("created_at")`
  - `updatedAt DateTime @default(now()) @updatedAt @map("updated_at")`
  - `createdBy String? @map("created_by")`
  - `updatedBy String? @map("updated_by")`

  Si un modelo ya tiene el campo con otro `@map`, no lo toca. Imprime un resumen con el formato `modelo: campos agregados`.
- [ ] **Step 2: Correr** `node prisma/scripts/add-trace-fields.mjs`, luego `pnpm prisma format` y `pnpm prisma validate` → `The schema ... is valid`. Revisar el diff de algunos modelos a mano.
- [ ] **Step 3: Crear la migración** con `pnpm prisma migrate dev --create-only --name audit_trail`. Agregar al final del SQL:

```sql
CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es inmutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
```

  Revisar que el SQL generado sea **solo** `ADD COLUMN` y `CREATE`, sin `DROP` ni `ALTER ... TYPE`.
- [ ] **Step 4: Escribir el test de integración** `audit-schema.int-spec.ts`:
  - `rechaza UPDATE sobre audit_logs`: insertar una fila, luego `prisma.auditLog.update(...)` → rejects con `audit_logs es inmutable`.
  - `rechaza DELETE sobre audit_logs`: lo mismo con `delete`.
- [ ] **Step 5: Aplicar y correr.** `pnpm prisma migrate dev` sobre la base local, luego `TEST_DATABASE_URL=<base de pruebas migrada> pnpm test:int` → PASS. Correr `pnpm typecheck` → sin errores.
- [ ] **Step 6: Commit** `feat(audit): tabla audit_logs y columnas de trazabilidad`

### Task 4: Extensión de Prisma conectada en `PrismaService`

**Files:**
- Create: `src/shared/infrastructure/audit/prisma-audit.extension.ts`
- Modify: `src/shared/infrastructure/database/prisma/prisma.service.ts`
- Test: `test/int/prisma-audit.int-spec.ts`

**Interfaces:**
- Consumes:
  - `AuditContext.get()` (Tarea 1)
  - `diffRecords`, `maskRecord`, `classifyUpdate` y `toJsonSafe` (Tarea 2)
  - `prisma.auditLog` (Tarea 3)
- Produces:
  - `createAuditExtension(service: PrismaService)`: el argumento de `$extends`.
  - `AUDIT_EXCLUDED_MODELS: ReadonlySet<string>`
  - `PrismaService` cuyos accesos a modelos y `$transaction` pasan por el cliente extendido, con la misma API pública (`atomic`, `@Atomic`).

- [ ] **Step 1: Spike de conexión.** Antes de escribir la lógica, confirmar la mecánica con un test de integración mínimo:
  1. En el constructor, crear `this.extended = this.$extends(createAuditExtension(this))`.
  2. En el `Proxy`, sin transacción ambiente, devolver las propiedades de modelo y `$transaction` desde `extended`.
  3. `atomic()` usa `extended.$transaction(...)`.

  Criterio: un `query` hook vacío que cuenta llamadas se dispara **dentro y fuera** de `atomic()`, y `pnpm test:unit` sigue en verde. Si `$extends` no convive con `extends PrismaClient` y el `Proxy`, parar y reportar antes de seguir.
- [ ] **Step 2: Escribir los tests de integración que fallan** en `prisma-audit.int-spec.ts`, usando `AuditContext.run({ userId: 'u-1', source: 'HTTP', ... })` sobre modelos simples (`Role` y, para `applicationId`, `Client`):
  - `create llena createdBy/updatedBy y registra CREATE con snapshot`
  - `create respeta un createdBy ya informado`
  - `update registra solo los campos cambiados en changes`
  - `update sin cambios reales no registra nada` (Review Focus 4)
  - `update de deletedAt null→fecha registra SOFT_DELETE, y fecha→null registra RESTORE`
  - `delete registra DELETE con snapshot del antes`
  - `updateMany y deleteMany registran una fila por registro afectado`
  - `updateMany sobre más de 1000 filas registra una sola fila resumen con metadata.count`
  - `upsert registra CREATE si no existía y UPDATE si existía`
  - `copia applicationId del registro a audit_logs.application_id`
  - `un error dentro de atomic() tras la escritura revierte el cambio y el log` (Review Focus 1)
  - `actualizar User.password guarda changes.password = { before: '***', after: '***' }` (Review Focus 5)
  - `escribir en Notification no genera log`
  - `fuera de contexto registra source SYSTEM y userId null`
  - `create con escrituras anidadas registra una fila para el modelo raíz`
- [ ] **Step 3: Correr** `pnpm test:int` → FAIL.
- [ ] **Step 4: Implementar** `createAuditExtension` con `query: { $allModels: { create, createMany, createManyAndReturn, update, updateMany, upsert, delete, deleteMany } }`, siguiendo estas reglas:
  - Si el modelo está en `AUDIT_EXCLUDED_MODELS` → `return query(args)`.
  - Si no hay transacción ambiente → `return service.atomic(() => service[camel(model)][operation](args))`. Al reentrar ya hay transacción; todas las lecturas previas y el `auditLog.createMany` usan esa misma transacción, accesible vía `service`, que el `Proxy` dirige a la transacción ambiente.
  - Completar `createdBy/updatedBy` solo si el modelo tiene esos campos. Para saberlo, se consulta `Prisma.dmmf.datamodel` una sola vez y se guarda en un `Map<model, Set<field>>`.
  - Si el modelo no tiene `id` escalar, `recordId` es `JSON.stringify` de la clave única.
  - `createMany` se ejecuta como `createManyAndReturn` y devuelve `{ count }`, para no cambiar el contrato.
- [ ] **Step 5: Correr** `pnpm test:int` → PASS. Correr `pnpm test:unit`, `pnpm test:e2e` y `pnpm typecheck` → todo en verde.
- [ ] **Step 6: Commit** `feat(audit): registrar automáticamente toda escritura de Prisma`

### Task 5: Eventos de autenticación, accesos denegados y bloqueo de SQL crudo

**Files:**
- Create: `src/shared/infrastructure/audit/audit.service.ts`
- Modify: `audit.module.ts` (exportar `AuditService`)
- Modify: `src/modules/identity/application/use-cases/auth/login-user.use-case.ts`, `request-password-reset.use-case.ts`, `reset-password.use-case.ts`
- Modify: `src/modules/identity/presentation/controllers/auth.controller.ts` (nuevo `POST /auth/logout`)
- Modify: `src/shared/presentation/guards/admin.guard.ts`
- Modify: `eslint.config.mjs`
- Test: `src/shared/infrastructure/audit/audit.service.spec.ts`, más extensiones de `admin.guard.spec.ts` y de los specs de los casos de uso de auth (crearlos si no existen)

**Interfaces:**
- Consumes: `AuditContext.get()` y `PrismaService`
- Produces:
  - `AuditService.record(input: { action: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET' | 'ACCESS_DENIED'; userId?: string | null; metadata?: Record<string, unknown>; outsideTransaction?: boolean }): Promise<void>`
  - Con `outsideTransaction: true`, escribe con el cliente base, fuera de la transacción ambiente, y ante un error lo registra en pino sin propagarlo.

  Si las capas del repo exigen pasar por un port (ver `scripts/check-architecture.cjs`), definir `AUDIT_RECORDER` en `src/shared/application/ports/` y que `AuditService` lo implemente.

- [ ] **Step 1: Escribir los tests que fallan**
  - `record usa userId/ip/userAgent/requestId del contexto si no se pasan`
  - `record con outsideTransaction no propaga un error de escritura`
  - Login exitoso → `record({ action: 'LOGIN', userId, metadata: { email } })`
  - Credenciales inválidas → `LOGIN_FAILED` con `metadata: { email, reason: 'INVALID_CREDENTIALS' }`; usuario inactivo → `reason: 'INACTIVE_USER'`. Nunca incluye la contraseña.
  - `POST /auth/logout` → `LOGOUT` y responde 204.
  - Solicitud de reset → `PASSWORD_RESET` con `{ step: 'REQUEST' }`; confirmación → `{ step: 'CONFIRM' }`.
  - `AdminGuard` sin rol `ADMIN` → `ACCESS_DENIED` con `{ method, path, required: 'ADMIN_ROLE' }`, y sigue lanzando `ForbiddenException`.
- [ ] **Step 2: Correr** `pnpm jest audit.service admin.guard login-user` → FAIL.
- [ ] **Step 3: Implementar.**
  - `LOGIN_FAILED` y `ACCESS_DENIED` usan `outsideTransaction: true`.
  - `/auth/logout` usa `JwtAuthGuard`, no invalida el JWT (es stateless) y solo registra.
  - En ESLint, `no-restricted-properties` prohíbe `$executeRaw`, `$executeRawUnsafe`, `$queryRaw` y `$queryRawUnsafe` en `src/**`, salvo en `src/shared/infrastructure/database/**` y en `src/modules/contabilidad/infrastructure/persistence/period-transaction.adapter.ts`. Ese adapter usa `$queryRaw` solo para `SELECT ... FOR UPDATE`; lleva un comentario con el motivo.
- [ ] **Step 4: Correr** los tests → PASS. Correr `pnpm lint:check` → 0 errores.
- [ ] **Step 5: Commit** `feat(audit): eventos de login, logout, reset y acceso denegado`

### Task 6: API de consulta de auditoría

**Files:**
- Create: en `src/modules/identity/`, siguiendo el patrón de `menus`:
  - `domain/repositories/audit-log.repository.ts`
  - `infrastructure/persistence/repositories/audit-log-prisma.repository.ts`
  - `application/use-cases/audit/list-audit-logs.use-case.ts`
  - `application/use-cases/audit/get-audit-log.use-case.ts`
  - `presentation/controllers/audit-logs.controller.ts`
  - `presentation/dtos/audit/list-audit-logs.query.ts`
- Modify: `identity.module.ts` e `identity-persistence.module.ts`
- Test: `list-audit-logs.use-case.spec.ts` y `audit-logs.controller.spec.ts`

**Interfaces:**
- Produces:
  - `GET /audit-logs?userId&applicationId&action&tableName&recordId&from&to&page&limit` → `{ items: AuditLogItem[]; total: number; page: number; limit: number }`
    - Orden `occurredAt desc`.
    - `limit` por defecto 50, máximo 200.
    - `from` y `to` son fechas `YYYY-MM-DD` interpretadas en zona Lima (usar `parseDateOnly` de `shared`).
  - `GET /audit-logs/:id` → `AuditLogItem`
  - `AuditLogItem = { id, occurredAt, action, tableName, recordId, applicationId, applicationName, userId, userName, changes, snapshot, metadata, ip, userAgent, source }`
    - `userName` = `"firstName lastName"`, o `null` si el usuario no existe.
  - Ambos endpoints con `JwtAuthGuard` + `AdminGuard`. No hay endpoints de escritura.

- [ ] **Step 1: Escribir los tests que fallan**
  - Los filtros se traducen a un `where` correcto.
  - `limit` de 500 se recorta a 200.
  - `userName` es `null` si el usuario fue borrado.
  - Un usuario sin rol `ADMIN` recibe 403.
- [ ] **Step 2: Correr** `pnpm jest audit-log` → FAIL.
- [ ] **Step 3: Implementar.** Los nombres de usuario y de app se resuelven con un `findMany` por los ids de la página, sin N+1.
- [ ] **Step 4: Correr** → PASS. Correr `pnpm check:architecture` → OK.
- [ ] **Step 5: Commit** `feat(audit): API de consulta de auditoría`

### Task 7: Pantalla de Auditoría (frontend)

**Files:**
- Create: en `src/modules/settings/`, siguiendo el patrón de `role-applications`:
  - `domain/repositories/audit-logs.repository.ts`
  - `application/ports/audit-logs.port.ts`
  - `infrastructure/repositories/audit-logs.api.repository.ts`
  - `presentation/composables/useAuditLogs.ts`
  - `presentation/views/AuditLogsView.vue`
  - `presentation/components/audit/AuditLogDetailPanel.vue`
- Modify: `settings.types.ts`, `presentation/router/index.ts` (ruta `audit`, name `settings-audit`, `meta: { title: 'Auditoría', requiresAdmin: true }`), el menú de `SettingsLayout.vue` y `tests/contracts/routes.json`

- [ ] **Step 1: Implementar la vista.**
  - Tabla con columnas fecha y hora (formato `dd/MM/yyyy HH:mm:ss`, hora Lima), usuario, acción (badge por color: `CREATE` success, `UPDATE` brand, `DELETE`/`SOFT_DELETE` error, `ACCESS_DENIED`/`LOGIN_FAILED` warning, resto gris), app, tabla, registro e IP.
  - Filtros: usuario, app, acción, tabla y rango de fechas.
  - Paginación.
  - Clic en una fila → `AuditLogDetailPanel`:
    - `UPDATE` → tabla Campo / Antes / Después;
    - `CREATE`/`DELETE` → lista clave–valor del snapshot;
    - eventos → metadata.

  Usar los componentes `Base*` y `ui/` existentes (ver la memoria del proyecto sobre TailAdmin).
- [ ] **Step 2: Agregar la ruta y actualizar** `tests/contracts/routes.json` con la entrada nueva.
- [ ] **Step 3: Correr** `pnpm test` y `pnpm typecheck` → PASS.
- [ ] **Step 4: Verificar en el navegador** (`localhost:5173/settings/audit` como admin):
  - editar un rol en otra pestaña y ver la fila `UPDATE` con su antes/después;
  - entrar con un usuario no admin y confirmar que redirige.

  Revisar en modo claro y oscuro.
- [ ] **Step 5: Commit** (repo frontend) `feat(settings): pantalla de auditoría`

---

# Fase 2 — Acceso por rol y aplicación

### Task 8: Nivel de acceso en `role_applications`

**Files:**
- Modify: `prisma/models/applications.prisma`: agregar `enum ApplicationAccessLevel { READ WRITE ADMIN }` y `accessLevel ApplicationAccessLevel @default(READ) @map("access_level")`; quitar `canRead`, `canWrite`, `canDelete` y `canAdmin`.
- Create: `prisma/migrations/<timestamp>_role_application_access_level/migration.sql`
- Modify: `prisma/seed/steps/roles-applications.ts`
- Modify: `src/modules/identity/domain/repositories/role.repository.ts`, `role-prisma.repository.ts`, `assign-application-to-role.use-case.ts`, `roles.controller.ts`
- Create: `src/modules/identity/presentation/dtos/roles/set-role-application-access.dto.ts`
- Create: `src/modules/identity/application/use-cases/roles/get-role-applications-matrix.use-case.ts`
- Test: `assign-application-to-role.use-case.spec.ts` y `get-role-applications-matrix.use-case.spec.ts`

**Interfaces:**
- Produces:
  - `type AccessLevel = 'READ' | 'WRITE' | 'ADMIN'`, exportado desde `src/shared/domain/access-level.ts` con `ACCESS_LEVEL_RANK = { READ: 1, WRITE: 2, ADMIN: 3 }` y `levelAllows(granted: AccessLevel, required: AccessLevel): boolean`. Va en `shared` porque lo usan tanto `identity` como el guard de `shared`.
  - `RoleRepository.setApplicationAccess(roleId: string, applicationId: string, level: AccessLevel): Promise<void>` reemplaza a `assignApplication`; `revokeApplication` sigue igual.
  - `PUT /roles/:roleId/applications/:applicationId` con body `{ accessLevel: AccessLevel }` → 204. `POST` queda como alias de `PUT` con `WRITE`, para no romper clientes viejos durante el deploy.
  - `GET /roles/applications-matrix` → `{ roles: RoleInfo[]; applications: ApplicationItem[]; access: Record<roleId, Record<applicationId, AccessLevel>> }`. Se declara **antes** de `@Get(':id')` en el controlador.
  - Todo con `AdminGuard`, como hoy.

- [ ] **Step 1: Migración.** Generar con `--create-only` y editar el SQL en este orden:
  1. crear el enum;
  2. `ADD COLUMN access_level ... NOT NULL DEFAULT 'READ'`;
  3. `UPDATE role_applications SET access_level = 'WRITE';`
  4. `DROP COLUMN` de los cuatro `can_*`.
- [ ] **Step 2: Escribir los tests que fallan**
  - `setApplicationAccess` crea o actualiza con el nivel dado.
  - La matriz devuelve `access[roleId][appId] = 'WRITE'` para una fila existente y omite las apps sin fila.
  - Un body con `accessLevel: 'OWNER'` → 400.
- [ ] **Step 3: Correr** `pnpm jest role` → FAIL.
- [ ] **Step 4: Implementar** el repositorio, los use cases, el DTO (zod, como los demás DTOs) y el controlador. Actualizar el seed: rol `ADMIN` → `ADMIN`, resto → `WRITE`.
- [ ] **Step 5: Aplicar** la migración en la base local. Correr `pnpm test:unit` y `pnpm typecheck` → verde. Verificar con `SELECT access_level, count(*) FROM role_applications GROUP BY 1;` que todo quedó en `WRITE`.
- [ ] **Step 6: Commit** `feat(identity): nivel de acceso por rol y aplicación`

### Task 9: Niveles efectivos del usuario

**Files:**
- Create: `src/modules/identity/application/services/application-access.service.ts`
- Create: `src/shared/application/ports/application-access.port.ts` (token `APPLICATION_ACCESS`, para que el guard de `shared` no dependa de `identity`)
- Modify: `application-prisma.repository.ts`, `get-user-applications.use-case.ts`, `application-response.dto.ts`, `application-http.mapper.ts`
- Modify: `menus.controller.ts` (403 sin acceso)
- Modify: los use cases de asignar o revocar rol a usuario y de cambiar acceso de rol (invalidación)
- Test: `application-access.service.spec.ts`

**Interfaces:**
- Consumes: `AccessLevel`, `ACCESS_LEVEL_RANK` y `levelAllows` de `src/shared/domain/access-level.ts` (Tarea 8)
- Produces (por `APPLICATION_ACCESS`):
  - `getLevels(userId: string): Promise<Map<string /*slug*/, { level: AccessLevel; applicationId: string; name: string }>>`
  - `invalidate(userId?: string): void`: sin argumento limpia toda la caché, que es lo que se usa al cambiar el acceso de un rol.
  - `GET /applications/me`: cada item suma `accessLevel: AccessLevel`.

- [ ] **Step 1: Escribir los tests que fallan**
  - Un usuario con rol `ADMIN` → `ADMIN` en todas las apps activas.
  - Roles con `READ` y `WRITE` para la misma app → `WRITE`. Al revocar el rol `WRITE` y llamar `invalidate(userId)` → `READ` (Review Focus 2).
  - Un rol inactivo, eliminado o con `userRole` revocado no suma.
  - La caché devuelve el mismo resultado sin consultar el repositorio dentro de 30 s y vuelve a consultar después. Usar `jest.useFakeTimers()`.
- [ ] **Step 2: Correr** `pnpm jest application-access.service` → FAIL.
- [ ] **Step 3: Implementar.** Una sola consulta de `role_applications` filtrada por los roles activos del usuario, agrupando por app con el rango máximo. La caché es un `Map<userId, { at: number; levels }>`. Llamar `invalidate` desde:
  - `assign-user-role` y `revoke-user-role` → `invalidate(userId)`;
  - `setApplicationAccess`, `revokeApplication` y la desactivación de roles → `invalidate()`.

  `GET /menus/application/:slug` responde 403 con el mensaje de Global Constraints si el slug no está en `getLevels`.
- [ ] **Step 4: Correr** → PASS. Correr `pnpm typecheck` y `pnpm check:architecture` → OK.
- [ ] **Step 5: Commit** `feat(identity): niveles de acceso efectivos por usuario`

### Task 10: Guard de API por aplicación

**Files:**
- Create: `src/shared/presentation/decorators/application-access.decorators.ts`
- Create: `src/shared/presentation/guards/application-access.guard.ts`
- Modify: `src/composition/api.module.ts` (registrar `APP_GUARD`)
- Modify: **todos** los controladores en `src/modules/**/presentation/controllers/*.controller.ts` (decorador a nivel de clase)
- Test: `application-access.guard.spec.ts` y `src/composition/controllers-access.spec.ts`

**Interfaces:**
- Consumes: `APPLICATION_ACCESS.getLevels` (Tarea 9), `AuditService.record` (Tarea 5) y `JwtAuthGuard`
- Produces:
  - `@RequiresApplication(slug: string | string[] | { fromRequest: true; fallback: string[] })`
  - `@SkipApplicationAccess()`
  - `@RequiresAccessLevel(level: AccessLevel)` (a nivel de método)

- [ ] **Step 1: Escribir los tests que fallan** del guard:
  - `GET` con `READ` pasa; `POST` con `READ` → 403 con el mensaje exacto; `DELETE` con `WRITE` → 403; `DELETE` con `ADMIN` pasa.
  - `@RequiresAccessLevel('READ')` sobre un `POST` deja pasar con `READ`.
  - `fromRequest`:
    - toma `query.applicationSlug`, luego `body.applicationId` y luego `query.applicationId` (los ids se resuelven contra `getLevels` por `applicationId`);
    - sin ninguno, pasa si tiene alguna app del `fallback` y si no da 403 (Review Focus 3).
  - Un controlador sin decorador → 403 (falla cerrado).
  - `@SkipApplicationAccess()` → pasa sin consultar niveles.
  - Ante el 403 llama `record({ action: 'ACCESS_DENIED', outsideTransaction: true, metadata: { method, path, appSlug, required, granted } })`.
  - Si `req.user` no existe, llama `JwtAuthGuard.canActivate` primero. Si no hay token → 401, no 403.
- [ ] **Step 2: Escribir el test de inventario** `controllers-access.spec.ts`: `todo controlador registrado en ApiModule declara RequiresApplication o SkipApplicationAccess`. Recorrer los `imports` y `controllers` del módulo con `Reflect.getMetadata`. Listar en el mensaje de error los que falten.
- [ ] **Step 3: Correr** `pnpm jest application-access.guard controllers-access` → FAIL.
- [ ] **Step 4: Implementar** el guard y los decoradores. El guard es global (`APP_GUARD`), así que corre **antes** que el `@UseGuards(JwtAuthGuard)` de cada controlador; por eso valida el token él mismo con `JwtAuthGuard.canActivate(ctx)` cuando `req.user` no existe.
- [ ] **Step 5: Decorar los controladores** según la spec §5.3:
  - `alquileres`: `rentals`, `payments`, `reports`
  - `ventas-*` → `ventas`
  - `interiorismo-*` → `interiorismo`
  - `arquitectura-*` → `arquitectura`
  - `produccion-*` → `produccion`
  - `contabilidad-*` → `contabilidad`
  - `clients`, `properties`, `agents` → `{ fromRequest: true, fallback: ['alquileres', 'ventas'] }`
  - `@SkipApplicationAccess()` → `auth`, `users`, `roles`, `applications`, `menus`, `notifications`, `alert-config`, `audit-logs`

  Revisar los `POST` de solo consulta (reportes con filtros en el body: `grep -n "@Post" src/modules/*/presentation/controllers/*report*`) y marcarlos con `@RequiresAccessLevel('READ')`.
- [ ] **Step 6: Correr** `pnpm test:unit`, `pnpm test:e2e` y `pnpm typecheck` → verde.
- [ ] **Step 7: Verificación manual con curl** sobre el backend local, con un usuario que tenga `READ` en `contabilidad`:
  - `GET /api/contabilidad-accounts` → 200
  - `POST /api/contabilidad-accounts` → 403 con el mensaje exacto
  - aparece una fila `ACCESS_DENIED` en `audit_logs`
- [ ] **Step 8: Commit** `feat(security): aplicar nivel de acceso por aplicación en la API`

### Task 11: Matriz de niveles en Configuración (frontend)

**Files:**
- Modify: `src/modules/settings/domain/settings.types.ts` (agregar `AccessLevel` y `RoleApplicationsMatrix`)
- Modify: `domain/repositories/role-applications.repository.ts`, `application/ports/role-applications.port.ts`, `infrastructure/repositories/role-applications.api.repository.ts`
- Modify: `presentation/composables/useRoleApplications.ts`, `presentation/views/RoleApplicationsView.vue`

**Interfaces:**
- Consumes: `GET /roles/applications-matrix`, `PUT` y `DELETE /roles/:roleId/applications/:applicationId` (Tarea 8)
- Produces:
  - `getMatrix(): Promise<RoleApplicationsMatrix>`
  - `setAccess(roleId, applicationId, level: AccessLevel): Promise<void>`
  - `revokeApplication(...)` (sin cambios)
  - Se eliminan `getRoleApplications` y `assignApplication`.

- [ ] **Step 1: Implementar la vista.**
  - Cada celda es un selector compacto: *Sin acceso / Lectura / Edición / Admin*. "Sin acceso" llama `revoke`; el resto, `setAccess`.
  - Colores: gris, `blue-light`, `brand` y `warning`.
  - La fila del rol `code === 'ADMIN'` muestra "Admin (total)" bloqueado en cada celda.
  - Guardado inmediato con estado *loading* por celda y toast de error (`markapAlert.toast.error`), como hoy.
  - Leyenda bajo el título: *Lectura: ver información · Edición: crear y modificar · Admin: además eliminar*.
- [ ] **Step 2: Correr** `pnpm typecheck` y `pnpm test` → PASS.
- [ ] **Step 3: Verificar en el navegador** (`/settings/role-applications`):
  - cambiar un nivel, recargar y confirmar que persiste;
  - en `/settings/audit` aparece el `UPDATE` de `role_applications`.

  Revisar en modo claro y oscuro.
- [ ] **Step 4: Commit** (frontend) `feat(settings): nivel de acceso por rol y aplicación`

### Task 12: Guard de router, acciones según nivel y badge

**Files:**
- Create: `src/modules/applications/presentation/composables/useApplicationAccess.ts`
- Create: `src/app/router/guards/application-access.guard.ts`
- Modify: `src/app/router/index.ts` (registrar después de `authGuard`), `src/modules/applications/domain/application.types.ts` (`accessLevel`), las rutas raíz de las 6 apps (`meta.applicationSlug`), `tests/contracts/routes.json`, `tests/run.mjs`, `ApplicationsView.vue` y el logout del store de auth
- Modify: las vistas de listado y detalle de cada app con botones de crear, editar o eliminar
- Test: `tests/application-access.test.ts`

**Interfaces:**
- Consumes: `GET /applications/me` con `accessLevel` (Tarea 9) y `POST /auth/logout` (Tarea 5)
- Produces:
  - `useApplicationAccess(slug: MaybeRef<string>) → { level: ComputedRef<AccessLevel | null>; canRead; canWrite; canAdmin }`
  - `canAccessRoute(levels: Record<string, AccessLevel>, slug: string | undefined): boolean`: función pura que usa el guard.

- [ ] **Step 1: Escribir el test que falla** `tests/application-access.test.ts` (estilo `node:assert`, como `routes.test.ts`):
  - `canAccessRoute({ contabilidad: 'READ' }, 'contabilidad') === true`
  - `canAccessRoute({}, 'contabilidad') === false`
  - `canAccessRoute({}, undefined) === true`

  Para `canWrite` y `canAdmin`, extraer `levelAllows(level, required): boolean` y probar `levelAllows('WRITE', 'ADMIN') === false`.
- [ ] **Step 2: Agregar el archivo a** `tests/run.mjs` y correr `pnpm test` → FAIL.
- [ ] **Step 3: Implementar.**
  - **Guard:** lee los niveles con `queryClient.ensureQueryData` (la misma query key que `useMyApplications`). Si no hay acceso, redirige a `/applications` y lanza el toast `No tienes acceso a <nombre o slug>`.
  - **Rutas:** agregar `applicationSlug` al `meta` de la ruta raíz de cada app. Actualizar `routes.json`.
  - **Selector de aplicaciones:** badge "Solo lectura" en la tarjeta si `accessLevel === 'READ'`.
  - **Logout:** el store llama `POST /auth/logout` sin esperar la respuesta (fire-and-forget) antes de limpiar la sesión.
- [ ] **Step 4: Ocultar acciones según nivel.**
  - Encontrar los botones con `grep -rln "Nuevo\|Nueva\|Editar\|Eliminar" src/modules/{alquileres,ventas,interiorismo,arquitectura,produccion,contabilidad}/**/views`.
  - En cada vista: `v-if="canWrite"` en crear y editar, y `v-if="canAdmin"` en eliminar, combinándolo con la condición que ya tenga (por ejemplo `canDelete && canAdmin`).
  - Lo que no se cubra queda protegido por el 403 del backend, que `apiErrorMessage.ts` ya traduce.
- [ ] **Step 5: Correr** `pnpm test` y `pnpm typecheck` → PASS.
- [ ] **Step 6: Verificar en el navegador** con un usuario de prueba con `READ` en `contabilidad` y sin `produccion`:
  - `/produccion` por URL redirige con toast;
  - en contabilidad no aparecen "Nuevo" ni "Eliminar";
  - la tarjeta muestra "Solo lectura".

  Revisar en modo claro y oscuro.
- [ ] **Step 7: Commit** (frontend) `feat(access): restringir rutas y acciones según nivel de acceso`

---

## Verificación final

- [ ] Backend: `pnpm verify` y `TEST_DATABASE_URL=... pnpm test:int` → verde.
- [ ] Frontend: `pnpm typecheck`, `pnpm test` y `pnpm build` → verde.
- [ ] Probar las migraciones en una **copia** de la base de producción antes del deploy (spec §8). Después, revisar en la matriz que cada rol tenga el nivel correcto.


## Continuación local — 25 de octubre de 2026

- Tareas 1–4: contexto, enmascarado, esquema y gancho de Prisma conservados y verificados con 21 pruebas de integración en `markap_test`.
- Tareas 5–6: eventos de login, intentos fallidos, logout, recuperación y denegaciones; API de auditoría de solo lectura para administradores.
- Tareas 8–10: niveles por rol/app, matriz, resolución del máximo, caché de 30 segundos e invalidación, guard global e inventario de controladores. Recursos compartidos por id verifican la aplicación de la fila.
- Tareas 7, 11–12: pantalla de auditoría, matriz con cuatro opciones, ruta por aplicación, badge de lectura y acciones según nivel en las vistas y menús de fila.
- Migraciones aplicadas primero en `markap_deploy_validation` y `markap_test`, después en `markap_db`, todas en `127.0.0.1:55433`. Respaldo previo en `auditoria/privado/markap-pre-acceso-auditoria.dump`.
- La copia `markap_db` no tenía historial de Prisma: se registró el baseline existente antes de aplicar las dos migraciones nuevas.
- La regla contra SQL crudo admite únicamente los bloqueos de lectura preexistentes mediante excepciones por llamada documentadas. También había `SELECT pg_advisory_xact_lock` mediante `$executeRaw`: no cambia datos. Toda nueva llamada queda prohibida por lint.
- Prueba HTTP con usuarios temporales en `markap_test`: READ consulta y rechaza escrituras; WRITE pasa a validación y rechaza DELETE; matriz persiste; revocación invalida inmediatamente; auditoría y logout comprobados. Usuarios y roles temporales eliminados al terminar.
- Frontend: pruebas aprobadas con 314 rutas y 204 componentes diferidos. Revisión visual clara/oscura pendiente: el navegador de vista previa no respondió.
- No se realizaron commits ni pushes. Los pasos «Commit» del plan se reservan al usuario.

### Verificación de cierre

- Backend: arquitectura, tipos, lint y compilación aprobados; 109 pruebas unitarias, 12 e2e y 21 de integración aprobadas.
- Frontend: tipos, pruebas de sincronización/errores/arquitectura/acceso/rutas y build aprobados. El build conserva la advertencia existente sobre chunks grandes.
- Backend principal comprobado en `localhost:4001`: `/applications/me`, `/roles/applications-matrix` y `/audit-logs` responden 200; administrador recibe las seis aplicaciones con nivel ADMIN.
- Sigue pendiente únicamente la comprobación visual en claro/oscuro. No se publicó ni se envió nada a Git.
