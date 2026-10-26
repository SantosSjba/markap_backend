# Acceso por rol y aplicación + auditoría completa — Diseño

- **Fecha:** 2026-10-25
- **Estado:** pendiente de revisión
- **Repos afectados:** `markap_backend` (mayor parte), `markap_frontend`

## 1. Contexto

Hoy:

- `role_applications` es un sí/no por rol y app. Solo filtra las tarjetas del selector (`ApplicationPrismaRepository.findByUserId`).
- Las columnas `can_read / can_write / can_delete / can_admin` existen, pero ningún código las lee ni la UI las muestra.
- No hay control de acceso real:
  - **Frontend:** el router (`app/router/guards/auth.guard.ts`) solo valida sesión y `requiresAdmin`. Cualquiera entra a `/contabilidad` por URL.
  - **Backend:** los controladores de negocio solo usan `JwtAuthGuard`, así que cualquier usuario autenticado llama cualquier API.
- Trazabilidad mínima: de 156 modelos, 22 tienen `createdBy`, 4 `updatedBy` y 95 `updatedAt`. Solo Contabilidad tiene un log de auditoría propio (`contabilidad_audit_logs`), que registra resúmenes de negocio.
- `PrismaService` ya usa `AsyncLocalStorage` para compartir la transacción ambiente (`atomic()` / `@Atomic()`) entre repositorios.

## 2. Objetivos

1. **Fase 1 — Auditoría completa:** cada escritura en la base y cada acción sensible queda registrada con usuario, fecha y hora, origen y valores antes/después. Todas las tablas de negocio guardan quién y cuándo creó y modificó cada registro.
2. **Fase 2 — Acceso por rol y aplicación:** cada rol tiene un nivel de acceso por app, y ese nivel se respeta en el selector, el router y la API.

### Fuera de alcance

- Permisos por módulo/menú o por acción granular (queda para una versión futura; el diseño no lo bloquea).
- Reemplazar o migrar `contabilidad_audit_logs` (se mantiene tal cual).
- Retención/purga de logs, exportación de auditoría a sistemas externos.
- Auditoría de lecturas (GET) de datos; solo se auditan escrituras, eventos de autenticación y accesos denegados.

## 3. Decisiones

| Tema | Decisión |
|---|---|
| Niveles de acceso | `READ`, `WRITE`, `ADMIN` por rol y app. Sin fila = sin acceso. |
| Rol `ADMIN` | Acceso total a todas las apps sin configuración; igual queda auditado. |
| Varios roles | El usuario recibe el **mayor** nivel entre sus roles activos para cada app. |
| Dónde se audita | Extensión central de Prisma (no en cada caso de uso). |
| Atomicidad | La fila de auditoría se escribe en la **misma transacción** que el cambio; si falla, el cambio se revierte. |
| Retención | Indefinida. La app no expone edición ni borrado de `audit_logs`. |
| Datos sensibles | Enmascarados (`"***"`) en el antes/después. |
| Registros existentes | Quedan con `created_by/updated_by = NULL`; la auditoría empieza al activarse. |

---

## 4. Fase 1 — Auditoría

### 4.1 Contexto del request (`AuditContext`)

Nuevo módulo `src/shared/infrastructure/audit/`.

```ts
interface AuditContextData {
  userId: string | null      // sub del JWT; null = sistema/anónimo
  requestId: string | null   // el que ya genera nestjs-pino
  ip: string | null
  userAgent: string | null
  source: 'HTTP' | 'WS' | 'JOB' | 'SEED' | 'SYSTEM'
}
```

- Un `AsyncLocalStorage<AuditContextData>` expuesto por un servicio `AuditContext` con dos métodos: `get()` y `run(data, fn)`.
- **HTTP:** un interceptor global (`AuditContextInterceptor`, registrado con `APP_INTERCEPTOR`) envuelve el handler en `run(...)`. Los guards corren antes que los interceptores, así que `req.user` ya está disponible.
- **Jobs/cron, WebSocket y seed:** envuelven su trabajo con `AuditContext.run({ source: 'JOB' | 'WS' | 'SEED', userId: null | <id> })`. Fuera de cualquier contexto, el valor por defecto es `source: 'SYSTEM', userId: null`; nunca falla por falta de contexto.

### 4.2 Tabla `audit_logs`

Archivo nuevo `prisma/models/audit.prisma`:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  occurredAt  DateTime @default(now()) @map("occurred_at")
  userId      String?  @map("user_id")
  action      String   // CREATE | UPDATE | DELETE | SOFT_DELETE | RESTORE
                       // | LOGIN | LOGIN_FAILED | LOGOUT | PASSWORD_RESET
                       // | ACCESS_DENIED
  tableName   String?  @map("table_name")   // nombre físico (@@map)
  recordId    String?  @map("record_id")
  applicationId String? @map("application_id") // si el registro tiene applicationId
  changes     Json?    // { campo: { before, after } } para UPDATE
  snapshot    Json?    // fila completa en CREATE (after) y DELETE (before)
  metadata    Json?    // datos del evento (ruta, método, motivo del 403, email del login fallido…)
  ip          String?
  userAgent   String?  @map("user_agent")
  requestId   String?  @map("request_id")
  source      String   // HTTP | WS | JOB | SEED | SYSTEM

  @@index([occurredAt])
  @@index([userId, occurredAt])
  @@index([tableName, recordId])
  @@index([applicationId, occurredAt])
  @@index([action])
  @@map("audit_logs")
}
```

- Sin FK a `users` (el log sobrevive aunque se elimine el usuario y no bloquea borrados).
- Inmutable a nivel de base: la migración crea un trigger `BEFORE UPDATE OR DELETE ON audit_logs` que lanza error. Así, ni un bug ni un `deleteMany` accidental pueden alterarlo.

### 4.3 Extensión de Prisma (gancho central)

`PrismaService` hoy extiende `PrismaClient` y devuelve un `Proxy` para la transacción ambiente. El gancho se implementa como **extensión `$extends({ query: { $allModels: { ... } } })`** aplicada a ese cliente, de modo que también aplique a los clientes de transacción (`tx`). El detalle de cómo convivir con el `Proxy` se resuelve en el plan; el requisito es que **toda** escritura, dentro o fuera de `atomic()`, pase por el gancho.

Operaciones interceptadas y comportamiento:

| Operación | Antes de ejecutar | Después de ejecutar | Fila(s) en `audit_logs` |
|---|---|---|---|
| `create` | Setea `createdBy` y `updatedBy` = userId (si el modelo los tiene y no vienen informados) | — | 1 × `CREATE`, `snapshot` = fila creada |
| `createMany` / `createManyAndReturn` | Igual, por cada fila | — | 1 por fila (`createMany` se ejecuta como `createManyAndReturn` para obtener ids) |
| `update` | Setea `updatedBy`; lee la fila actual (`findUnique` con el mismo `where`) | Calcula diff | 1 × `UPDATE` con `changes` (solo campos que cambiaron). Si el diff solo tiene `deletedAt` de null → valor: `SOFT_DELETE`; de valor → null: `RESTORE` |
| `updateMany` | Setea `updatedBy`; lee las filas afectadas (`findMany` con el mismo `where`) | Relee por ids y calcula diff | 1 por fila afectada |
| `upsert` | Lee la fila por `where` | — | `CREATE` o `UPDATE` según existiera |
| `delete` | Lee la fila | — | 1 × `DELETE`, `snapshot` = fila borrada |
| `deleteMany` | Lee las filas afectadas | — | 1 por fila |

Reglas:

- **Atomicidad:** si la operación no está dentro de una transacción, el gancho la envuelve en una (`atomic()`); la escritura del log usa el mismo cliente/tx.
- **Escrituras anidadas** (`create: { items: { create: [...] } }`): Prisma no dispara el gancho por cada modelo anidado. El gancho registra la operación raíz con los datos anidados en `snapshot`/`changes`. Se documenta y se agrega un test; si un caso de uso necesita trazabilidad por hijo, usa escrituras explícitas.
- **SQL crudo** (`$executeRaw`, `$queryRaw`): hoy no hay ningún uso en `src/`. El gancho no lo audita, así que se agrega una regla de lint (`no-restricted-syntax`) que prohíbe su uso fuera de `shared/infrastructure/database`. Una excepción futura tendrá que registrar su propio log con `AuditService.record(...)`.
- **Modelos excluidos del gancho:** `AuditLog` (evita recursión), `ContabilidadAuditLog`, `Notification` y `PasswordResetCode`. Este último se audita como evento `PASSWORD_RESET`, sin el código.
- **Diff:** comparación por campo escalar. `Decimal` y `Date` se comparan serializados; `Json` por igualdad profunda. Campos `updatedAt/updatedBy` se excluyen del diff (siempre cambian).
- **Enmascarado:** lista central de nombres de campo sensibles (inicial: `password`, `code` en `PasswordResetCode`, `solPassword`, `solUser`, `clientSecret`, `apiKey`, `token`, `certificate`, `certificatePassword` y cualquier campo cuyo nombre contenga `password`, `secret` o `token`). El valor se guarda como `"***"`; en `changes` se registra que cambió, sin los valores. La lista exacta se completa en el plan, revisando `contabilidad-sol.prisma` y `contabilidad-cpe.prisma`.
- **`applicationId`:** si la fila (antes o después) tiene `applicationId`, se copia a la columna del log para filtrar por app.
- **Rendimiento:** cada `update`/`delete` agrega una lectura previa, y cada `*Many` una lectura de las filas afectadas. Es aceptable para el volumen actual (pocos usuarios). Un `updateMany` de más de 1 000 filas registra **una** fila resumen (`metadata: { count, where }`) en vez de una por fila, para no bloquear procesos masivos.

### 4.4 Columnas de trazabilidad en todas las tablas

Migración que agrega, a **cada modelo de negocio** que no las tenga:

- `created_at TIMESTAMP NOT NULL DEFAULT now()`
- `updated_at TIMESTAMP NOT NULL DEFAULT now()` (+ `@updatedAt` en Prisma)
- `created_by TEXT NULL`
- `updated_by TEXT NULL`

Notas:

- Sin FK a `users`; es un id de texto, igual que los `createdBy` actuales.
- Excluidos: `audit_logs`, `contabilidad_audit_logs`, `notifications` y `password_reset_codes`.
- Los 22 modelos que ya tienen `createdBy` solo reciben lo que les falta.
- En las tablas pivote (`user_roles`, `role_applications`…) también se agregan; `user_roles` ya tiene `assignedBy/revokedBy` y se conservan.
- La migración es solo aditiva (columnas nulas o con default): no reescribe datos ni bloquea por mucho tiempo en tablas chicas. Se valida antes en una copia de la base.
- El gancho (4.3) llena `createdBy/updatedBy`; ningún caso de uso tiene que hacerlo. Los casos de uso que hoy setean `createdBy` a mano siguen funcionando, porque el gancho no pisa un valor ya informado.

### 4.5 Eventos que no son escrituras de datos

Un `AuditService.record({ action, metadata, userId? })` para eventos explícitos:

| Evento | Dónde | `metadata` |
|---|---|---|
| `LOGIN` | caso de uso de login, al éxito | `{ email }` |
| `LOGIN_FAILED` | login, credenciales inválidas o usuario inactivo | `{ email, reason }` (sin contraseña) |
| `LOGOUT` | endpoint de logout | — |
| `PASSWORD_RESET` | solicitud y confirmación de reset | `{ step: 'REQUEST' \| 'CONFIRM' }` |
| `ACCESS_DENIED` | `AdminGuard` y el nuevo `ApplicationAccessGuard` (Fase 2) al lanzar 403 | `{ method, path, appSlug, required, granted }` |

`ACCESS_DENIED` se escribe **fuera** de la transacción del request: el request falla igual, pero el log debe quedar.

### 4.6 Pantalla de auditoría (frontend)

- Nueva ruta `Configuración → Auditoría` (`/settings/audit`), con `meta.requiresAdmin`.
- **Lista paginada** (más reciente primero) con columnas: fecha y hora, usuario (nombre), acción (badge), app, tabla, registro, IP.
- **Filtros:** usuario, aplicación, acción, tabla y rango de fechas.
- **Detalle** (panel lateral):
  - en `UPDATE`, tabla de campo / antes / después;
  - en `CREATE`/`DELETE`, el snapshot;
  - en eventos, la metadata.
- **Historial por registro:** endpoint `GET /audit-logs?tableName=&recordId=` reutilizable. Mostrarlo en las vistas de detalle de cada módulo queda fuera de alcance; solo se deja el endpoint.
- **Backend:** `AuditLogsController` (`GET /audit-logs`, `GET /audit-logs/:id`), protegido con `JwtAuthGuard` y `AdminGuard`. Solo tiene endpoints de lectura.

---

## 5. Fase 2 — Acceso por rol y aplicación

### 5.1 Datos

En `role_applications`:

- Agregar `access_level` (enum `ApplicationAccessLevel { READ WRITE ADMIN }`, `NOT NULL`).
- **Migración de datos:** los flags `can_*` nunca se aplicaron. El seed los llena de forma desigual: `canWrite = true` para los roles de negocio, todo `true` para `ADMIN`, y las filas creadas desde la pantalla quedan con los valores por defecto. Para que nadie pierda la edición que hoy tiene de hecho, **la migración asigna `WRITE` a todas las filas existentes**. Las filas del rol `ADMIN` no importan, porque ese rol tiene acceso total. El administrador ajusta después desde la pantalla, y el seed se actualiza para usar `accessLevel`.
- Eliminar `can_read`, `can_write`, `can_delete`, `can_admin` en la misma migración.

### 5.2 Resolución del nivel efectivo

`ApplicationAccessService.getLevels(userId): Map<slug, AccessLevel>`:

- Si el usuario tiene el rol activo `ADMIN` → `ADMIN` en todas las apps activas.
- Si no → por cada app, el **máximo** nivel entre sus `role_applications` de roles activos, no eliminados, y `user_roles` activos y no revocados (los mismos filtros que `findByUserId` hoy).
- Caché en memoria por `userId` con TTL de 30 s, invalidada al cambiar roles o accesos, para no consultar la base en cada request.

### 5.3 Guard de API (`ApplicationAccessGuard`)

Guard global (`APP_GUARD`) que corre después de `JwtAuthGuard`:

1. **Resolver la app del endpoint:**
   - Decorador explícito `@RequiresApplication('slug')` a nivel de controlador. Se agrega a todos los controladores de negocio; es más explícito que inferir por el nombre.
   - Prefijos de los controladores actuales que se mapean:
     - `alquileres`: `rentals`, `payments`, `reports`
     - `ventas`: `ventas-*`
     - `interiorismo`: `interiorismo-*`
     - `arquitectura`: `arquitectura-*`
     - `produccion`: `produccion-*`
     - `contabilidad`: `contabilidad-*`
   - **Controladores compartidos** (`clients`, `properties`, `agents`): `@RequiresApplication({ fromRequest: true })`. La app sale de `query.applicationSlug`, `body.applicationId` o `query.applicationId`.
   - Si un endpoint compartido no trae ninguno (por ejemplo, catálogos como `clients/departments`), se exige acceso a **al menos una** de las apps que usan ese controlador (`alquileres`, `ventas`).
   - **Sin chequeo de app:** `auth`, `users`, `roles`, `applications`, `menus`, `notifications`, `alert-config` y `audit-logs`. Siguen como hoy (sesión y, donde ya existe, `AdminGuard`); se marcan con `@SkipApplicationAccess()`.
   - Un controlador de negocio sin decorador **falla cerrado** (403). Además, un test recorre todos los controladores y exige que cada uno tenga `@RequiresApplication` o `@SkipApplicationAccess`.
2. **Nivel requerido por método HTTP:**

   | Método | Nivel mínimo |
   |---|---|
   | `GET`, `HEAD` | `READ` |
   | `POST`, `PUT`, `PATCH` | `WRITE` |
   | `DELETE` | `ADMIN` |

   Para excepciones (por ejemplo, un `POST` que solo consulta, como un reporte con filtros en el body), se usa `@RequiresAccessLevel('READ')` a nivel de método.
3. Si el nivel no alcanza → `ACCESS_DENIED` (4.5) y `403` con el mensaje "No tienes permiso para esta acción en <App>".

### 5.4 API para el frontend

- `GET /applications/me` agrega `accessLevel` a cada app. Las apps sin acceso ya no aparecen, igual que hoy.
- `GET /menus/application/:slug` → `403` si el usuario no tiene acceso a esa app.
- **Pantalla de configuración** (ya existen asignar y revocar):
  - `PUT /roles/:roleId/applications/:applicationId` con body `{ accessLevel }` crea o actualiza (reemplaza el actual "asignar").
  - `DELETE /roles/:roleId/applications/:applicationId` quita el acceso.
  - El GET de la página devuelve `{ roles, applications, access: { [roleId]: { [applicationId]: level } } }`.

### 5.5 Frontend

- **Configuración → Roles y aplicaciones** (`RoleApplicationsView.vue`):
  - La matriz se mantiene; cada celda pasa a ser un selector compacto con *Sin acceso / Lectura / Edición / Admin*, coloreado por nivel.
  - El rol `ADMIN` se muestra con todas las celdas en "Admin (total)", bloqueadas.
  - Cada cambio se guarda al instante, con un toast de confirmación o error, igual que hoy.
  - Una leyenda explica qué permite cada nivel.
- **Router:**
  - Las rutas de cada app declaran `meta.applicationSlug`.
  - El guard consulta los niveles (de `applications/me`, ya cacheado con TanStack Query). Sin acceso, redirige a `/applications` con un toast "No tienes acceso a <App>".
- **Composable `useApplicationAccess(slug)`:** expone `canRead`, `canWrite` y `canAdmin`. Se usa para ocultar los botones de crear y editar (`WRITE`) y eliminar (`ADMIN`) en las vistas principales de cada app: listados con botón "Nuevo" y acciones de fila.
  - Lo que no se cubra en esta entrega queda protegido igual por el `403` del backend, que el interceptor HTTP del frontend muestra como toast.
- **Selector de aplicaciones:** muestra un badge "Solo lectura" en la tarjeta cuando el nivel es `READ`.

---

## 6. Manejo de errores

- **Falla al escribir el log** dentro de una escritura: la transacción se revierte y el cliente recibe 500 con un mensaje genérico. El log del servidor (pino) registra la causa.
- **Falla al escribir `ACCESS_DENIED` o `LOGIN_FAILED`:** se registra en pino y no cambia la respuesta (403 o 401).
- **Usuario sin contexto** (job o seed): `userId = null`, `source` según el caso. Nunca se bloquea una escritura por falta de usuario.
- **Caché de niveles desactualizada:** como máximo 30 s. Se invalida al modificar `role_applications` o `user_roles` desde la propia app.

## 7. Pruebas

**Fase 1 (integración, contra base de pruebas):**

- `create`, `update`, `delete`, `updateMany` y `deleteMany` generan las filas esperadas, con `userId`, `changes` y `snapshot` correctos.
- `createdBy` y `updatedBy` se llenan solos y no pisan un valor informado.
- Un error después de la escritura dentro de `atomic()` revierte también el log.
- Los campos sensibles quedan enmascarados.
- Soft delete y restore se clasifican bien.
- `UPDATE`/`DELETE` directos sobre `audit_logs` fallan por el trigger.
- Los eventos `LOGIN`, `LOGIN_FAILED` y `ACCESS_DENIED` se registran.

**Fase 2 (unitarias e integración):**

- Guard: el método HTTP se traduce al nivel correcto; `ADMIN` pasa siempre; varios roles toman el máximo; los controladores compartidos resuelven la app desde query y body; sin decorador falla cerrado.
- Test de inventario: todo controlador tiene `@RequiresApplication` o `@SkipApplicationAccess`.
- Migración de datos: las filas existentes quedan en `WRITE`; el seed crea filas con `accessLevel`.
- Un usuario con nivel `WRITE` recibe `403` en `DELETE` (los niveles "Edición" y "Admin" difieren en poder eliminar).
- Frontend: el guard del router redirige sin acceso, y `useApplicationAccess` oculta las acciones.

## 8. Despliegue

1. **Fase 1:**
   - migración (`audit_logs` + trigger + columnas);
   - gancho y contexto;
   - eventos;
   - pantalla de auditoría.

   Se valida en una copia de la base de producción antes del deploy.
2. **Fase 2:**
   - migración de `role_applications`;
   - guard backend, con todos los controladores decorados;
   - frontend.

   Antes del deploy, revisar en la pantalla que cada rol tenga el nivel correcto. La migración deja todo en `WRITE`, así que nadie pierde acceso el día del cambio.
3. **Rollback:** las migraciones son aditivas, salvo la eliminación de `can_*` en la Fase 2. Revertir el código basta para volver al comportamiento anterior; `audit_logs` simplemente deja de crecer.

## 9. Riesgos y pendientes para el plan

- Convivencia de `$extends` con el `Proxy` de transacción ambiente de `PrismaService`. Es el punto técnico más delicado; el plan empieza con un spike corto que lo valide.
- Lista definitiva de campos sensibles.
- Inventario exacto de controladores y su app (unos 65 controladores).
