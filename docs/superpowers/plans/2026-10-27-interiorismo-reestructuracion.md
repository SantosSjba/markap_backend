# Reestructuración Interiorismo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Llevar el módulo Interiorismo al estándar compacto y multi-moneda de Ventas/Alquileres, con un presupuesto tipo hoja que reproduzca los Excel de la clienta.

**Architecture:** Frontend Vue 3 + TanStack Query por *features* (domain / application / infrastructure / presentation), backend NestJS + Prisma con casos de uso por módulo. Primero se extrae a `shared` lo que hoy está duplicado (moneda, acciones rápidas, código descriptivo); luego cada área del módulo se rehace sobre esa base.

**Tech Stack:** Vue 3, TypeScript, TanStack Vue Query, Tailwind (TailAdmin), NestJS, Prisma, Jest (backend), runner `tests/run.mjs` con `node:assert` (frontend).

**Spec:** `markap_backend/docs/superpowers/specs/2026-10-27-interiorismo-reestructuracion-design.md`

## Global Constraints

- **Nunca** `git add` / `commit` / `push`: los cambios quedan sin commit; los commits los hace el usuario.
- Monedas soportadas: `PEN`, `USD`, `EUR`. Símbolos: `S/`, `US$`, `€`. Nunca se suman montos de monedas distintas.
- Código de proyecto: `PROYECTO-<año>-<TIPO>-<DISTRITO>-<APELLIDO>`, sufijo `-2`, `-3` si se repite.
- UI: solo colores Markap; componentes `Base*` / `shared` (TailAdmin). `StatsCard compact` para KPIs. Tarjetas solo donde agrupan.
- Frontend: `pnpm verify` (arquitectura + typecheck + tests + build) debe pasar al cerrar cada fase.
- Backend: `pnpm test` y `pnpm build` deben pasar al cerrar cada fase que toque backend.
- Textos de UI en español (Perú), formato numérico `es-PE`.

## Review Focus

- Monto `null`/`undefined`/`NaN` → se muestra `—`, nunca `S/ NaN` (Task 1.1).
- Moneda desconocida o catálogo aún cargando → se muestra el código ISO o el símbolo fijo, sin romper la vista (Task 1.1).
- Totales con varias monedas → cifra principal en la primera moneda y el resto debajo; lista vacía → `S/ 0` (Task 1.1).
- Partes del código con tildes, guiones o espacios dobles (`San-Isidro`, `pérez`) → normalizadas en mayúsculas sin el separador (Task 1.3).
- Cliente empresa (RUC 20…) o con un solo nombre → apellido = primera palabra (Task 1.3).

---

## Fase 1 — Base compartida

### Task 1.1: Moneda compartida

**Files:**
- Create: `markap_frontend/src/shared/utils/money.ts`
- Create: `markap_frontend/src/shared/presentation/composables/useCurrencyCatalog.ts`
- Create: `markap_frontend/tests/money.test.ts` (y registrarlo en `tests/run.mjs`)
- Delete: `markap_frontend/src/modules/alquileres/presentation/composables/useCurrencyCatalog.ts`
- Delete: `markap_frontend/src/modules/ventas/presentation/composables/useVentasCurrencyCatalog.ts`
- Modify: los 12 consumidores de ambos composables (imports → `@shared/presentation/composables/useCurrencyCatalog`; en Ventas `useVentasCurrencyCatalog()` → `useCurrencyCatalog()`).

**Interfaces:**
- Produces (`shared/utils/money.ts`):
  - `type CurrencyCode = 'PEN' | 'USD' | 'EUR'`
  - `const SUPPORTED_CURRENCIES: readonly CurrencyCode[]` = `['PEN','USD','EUR']`
  - `formatMoney(amount: number | null | undefined, currency?: string | null): string` — `—` si no es número finito; si no, `formatCurrency(amount, currency ?? 'PEN')`.
  - `interface CurrencyAmount { currency: string; amount: number }`
  - `sumByCurrency<T>(items: readonly T[], currencyOf: (i: T) => string | null | undefined, amountOf: (i: T) => number | null | undefined): CurrencyAmount[]` — agrupa, ignora montos no finitos, moneda vacía = `PEN`, orden: primero la de mayor monto.
  - `splitCurrencyTotals(totals: readonly CurrencyAmount[], rounded?: boolean): { main: string; rest: string }` — `main` = primera moneda (`S/ 0` si vacío), `rest` = resto unido por ` · `.
- Produces (`useCurrencyCatalog()`): `{ currencies, options, isLoading, symbol(code), label(code), format(amount, code) }` — mismo contrato que el composable de Alquileres + `label` de Ventas; datos vía `useService(DIRECTORY).listCurrencies()`, `queryKey: ['shared-currencies']`, `staleTime: Infinity`. `format` delega en `formatMoney`.

- [x] **Step 1: Tests que fallan** (`tests/money.test.ts`)
  - `formatMoney(1200, 'PEN') === 'S/ 1,200.00'`; `formatMoney(800, 'USD') === 'US$ 800.00'`; `formatMoney(50, 'EUR') === '€ 50.00'`
  - `formatMoney(null, 'PEN') === '—'`; `formatMoney(NaN) === '—'`; `formatMoney(10, null) === 'S/ 10.00'`
  - `sumByCurrency([{c:'USD',a:100},{c:'PEN',a:50},{c:'USD',a:null},{c:'',a:5}], …)` → `[{currency:'USD',amount:100},{currency:'PEN',amount:55}]`
  - `splitCurrencyTotals([])` → `{ main: 'S/ 0.00', rest: '' }`; con PEN 10 y USD 5 → `{ main: 'S/ 10.00', rest: 'US$ 5.00' }`; `rounded=true` usa `formatCurrencyRounded`.
- [x] **Step 2:** `pnpm test` → FAIL (módulo no existe).
- [x] **Step 3:** Implementar `money.ts` y `useCurrencyCatalog.ts`.
- [x] **Step 4:** `pnpm test` → PASS.
- [x] **Step 5:** Migrar consumidores y borrar los dos composables de módulo; `pnpm typecheck && pnpm check:architecture` → sin errores.

### Task 1.2: Acciones rápidas compartidas

**Files:**
- Create: `markap_frontend/src/shared/presentation/components/dashboard/QuickActionsBar.vue`
- Modify: `modules/ventas/presentation/views/VentasHomeView.vue`, `modules/alquileres/presentation/views/AlquileresHomeView.vue` (pasan su lista de acciones)
- Delete: `modules/ventas/presentation/components/DashboardAccionesRapidas.vue`, `modules/alquileres/presentation/components/DashboardAccionesRapidas.vue`

**Interfaces:**
- Produces: `QuickActionsBar` con prop `actions: readonly QuickAction[]`, exportando `interface QuickAction { id: string; label: string; route: RouteLocationRaw; icon: string; primary?: boolean }`. Render idéntico al actual (fila de `BaseButton size="sm"`, primary/outline).
- Nota: los gráficos de barras del dashboard **no** se mueven; Interiorismo usará el ya compartido `shared/presentation/components/reports/MonthlyBarChart.vue`.

- [x] **Step 1:** Crear `QuickActionsBar.vue`; en cada Home definir `const quickActions: QuickAction[]` con las mismas rutas que hoy.
- [x] **Step 2:** Borrar los dos `DashboardAccionesRapidas.vue`; `pnpm typecheck` → OK.
- [x] **Step 3:** Navegador: Dashboard de Ventas y de Alquileres muestran los mismos botones y navegan igual.

### Task 1.3: Código descriptivo de proyecto

**Files:**
- Create: `markap_frontend/src/shared/domain/descriptive-code.ts` (mueve `CODE_SEPARATOR`, `normalizeCodePart`, `firstCodeWord`, `suggestSurname` desde `property-code.ts`)
- Modify: `modules/alquileres/features/propiedades/domain/property-code.ts` (usa las funciones compartidas; su API pública no cambia)
- Create: `modules/interiorismo/features/proyectos/domain/project-code.ts`
- Create: `markap_frontend/tests/project-code.test.ts` (+ `run.mjs`)
- Create: `markap_backend/src/modules/interiorismo/domain/utils/interior-project-code.util.ts` + `.spec.ts`

**Interfaces:**
- Frontend `project-code.ts`:
  - `const PROJECT_CODE_OPERATION = 'PROYECTO'`
  - `buildInteriorProjectCode(parts: { year: number; typeLabel?: string | null; district?: string | null; clientSurname?: string | null }): string` — `PROYECTO-<año>-<primera palabra del tipo>-<DISTRITO>-<APELLIDO>`, partes vacías se omiten.
  - Re-exporta `suggestSurname` como `suggestClientSurname(fullName, documentNumber?)`.
- Backend `interior-project-code.util.ts`:
  - `INTERIOR_PROJECT_CODE_OPERATION = 'PROYECTO'`
  - `buildInteriorProjectCode(parts: { year; typeLabel?; district?; clientSurname? }, usedCodes: readonly string[]): string` — misma regla + `withUniqueSuffix` (de `rentals/domain/utils/rental-code.util.ts`).
- Tipo = primera palabra de la etiqueta del tipo de proyecto (`Remodelación` → `REMODELACIÓN`, `Diseño interior` → `DISEÑO`).

- [x] **Step 1: Tests que fallan**
  - Front: `buildInteriorProjectCode({ year: 2026, typeLabel: 'Diseño interior', district: 'Cayma', clientSurname: 'Torres' }) === 'PROYECTO-2026-DISEÑO-CAYMA-TORRES'`; con `district: ' San-Isidro '` y `clientSurname: 'pérez'` → `…-SAN ISIDRO-PÉREZ`; solo año → `'PROYECTO-2026'`.
  - Front: `suggestClientSurname('Ana María Torres Vega') === 'Torres'`; `suggestClientSurname('Constructora Andina SAC', '20123456789') === 'Constructora'`.
  - Backend: igual que el primer caso + `usedCodes: ['PROYECTO-2026-DISEÑO-CAYMA-TORRES']` → `…-TORRES-2`.
  - Los tests existentes de `property-code.test.ts` siguen pasando sin cambios.
- [x] **Step 2:** `pnpm test` (front) y `pnpm test -- interior-project-code` (back) → FAIL.
- [x] **Step 3:** Implementar.
- [x] **Step 4:** Ambos → PASS.

### Task 1.4: Cierre de fase

- [x] `markap_frontend`: `pnpm verify` → OK.
- [x] `markap_backend`: `pnpm test -- interior-project-code` y `pnpm build` → OK.
- [x] Navegador: dashboards de Ventas/Alquileres y vistas con montos (Contratos, Detalle alquiler, Nuevo proceso) se ven igual que antes.

---

## Fases 2–10 (se detallan al empezar cada una, en este mismo archivo)

### Fase 2 — Proyectos ✅ (2026-10-27)

Decisiones de fase: el frontend arma el código (como `PropiedadForm`) y el backend garantiza unicidad con sufijo en vez de rechazar. Modo de margen e IGV van en la cabecera del presupuesto (Fase 3); el proyecto guarda los valores por defecto. `projectedCost`, `expectedMargin` y `progressPct` salen del formulario (se derivarán del presupuesto/ejecución). El montos del presupuesto en las pestañas Presupuesto/Compras/Liquidación siguen en soles hasta las Fases 3–4.

#### Task 2.1: Backend — campos, código único, filtros y stats
**Files:** `prisma/models/interiorismo-projects.prisma`, `prisma/migrations/20261027120000_interior_project_location_currency/migration.sql`, DTOs create/update, `interior-project.repository.ts`, `interior-project-prisma.repository.ts`, `create-/update-/list-interior-project(s).use-case.ts`, nuevo `get-interior-project-stats.use-case.ts`, controller, `prisma/scripts/migrate-interior-project-codes.ts` (+ script `prisma:migrate:interior-project-codes`).
- Columnas nuevas en `interior_projects`: `district_id` (FK `districts`, `ON DELETE SET NULL`), `legacy_code TEXT`, `default_overhead_pct DECIMAL(8,2) NOT NULL DEFAULT 0`, `exchange_rate DECIMAL(12,4)`.
- DTOs: `currency` ∈ `PEN|USD|EUR`; `districtId` uuid nullish; `defaultOverheadPct` ≥ 0; `exchangeRate` > 0 nullish.
- Create: si el código ya existe → `withUniqueSuffix(code, repo.listCodesWithPrefix(appId, code))`.
- List filtros nuevos: `projectType`, `agentId` (cualquiera de los 5 responsables). Ítem de lista agrega `currency`, `estimatedBudget`, `startDate`, `interventionLevel`, `district: { id, name } | null`, `paidTotal` (Σ pagos `PAID`).
- `GET /interiorismo-projects/stats?applicationSlug=` → `{ total, byStatus: Record<status, number>, createdThisMonth, activeBudgetByCurrency: CurrencyAmount[] }` (activos = `INTERIOR_PROJECT_ACTIVE_STATUS_CODES`, monto = `estimatedBudget`).
- Detalle agrega `district { id, name, provinceId, departmentId } | null`, `legacyCode`, `defaultOverheadPct`, `exchangeRate`.
- Script de códigos: idempotente; recodifica proyectos cuyo código no empieza con `PROYECTO-`, guarda el anterior en `legacyCode`; distrito = del proyecto o del cliente; año = `startDate` o `createdAt`.
- Tests: spec del use case de stats (agrupa por moneda, ignora cancelados/finalizados) y de create (sufijo `-2`).

#### Task 2.2: `InteriorProyectoForm.vue` único
**Files:** Create `features/proyectos/presentation/components/InteriorProyectoForm.vue`; rewrite `InteriorismoProyectoNuevoView.vue` / `InteriorismoProyectoEditarView.vue` como envoltorios (PageHeader + form); types en `project.types.ts`.
- Props: `initial?: InteriorProjectDetail | null`, `submitLabel`, `submitting`, `canWrite`. Emits `submit(payload: InteriorProjectFormPayload)`, `cancel`.
- Secciones (`FormSectionCard`): Datos generales (tipo, nombre, código de solo lectura con "Regenerar" en edición, etapa) · Cliente (`FormCombobox`) · Ubicación (dirección, departamento → provincia → distrito; el distrito por defecto es el del cliente) · Alcance (nivel I/II/III, m², niveles, ambientes, plazo) · Fechas · Equipo (5 responsables) · Condiciones económicas (moneda del catálogo, tipo de cambio, % utilidad, % GG, % IGV, presupuesto estimado).
- Lateral sticky: resumen (código, cliente, ubicación, moneda, presupuesto) + Guardar/Cancelar.

#### Task 2.3: Listado compacto + quitar «En progreso»
**Files:** `InteriorismoProyectosListView.vue`, `useInteriorProjects.ts` (+ `useInteriorProjectStats`), repo/port del front, `config/menu.ts`, `features/proyectos/presentation/router/index.ts`.
- KPIs `StatsCard compact`: Activos · En cotización · En ejecución · Finalizados · Cartera activa (`splitCurrencyTotals`).
- Fila: punto de estado · código + nombre + distrito · cliente + documento · tipo + nivel · etapa · presupuesto en su moneda + % cobrado · avance (barra) · fechas · `ActionsDropdown`.
- Filtros: búsqueda, etapa, tipo, responsable; `?status=` se lee al entrar. Ruta `en-progreso` → redirect `{ name: listado, query: { status: 'IN_PROGRESS' } }`; menú sin «En progreso».

#### Task 2.4: Ficha con pestañas sin tarjeta
**Files:** `InteriorismoProyectoDetalleView.vue`; Create `components/detail/ProjectSummaryTab.vue`, `ProjectExecutionTab.vue`, `ProjectDocumentsTab.vue`, `ProjectActivityTab.vue`.
- `PageHeader` con `back`, badges (código, tipo, etapa) y acciones (Editar).
- KPIs compactos: Presupuesto (total del presupuesto o estimado, en la moneda del proyecto) · Cobrado · Pendiente · Avance.
- `BaseTabs` suelto + vista (`?tab=`). Resumen = `FormSectionCard` Datos / Ubicación / Equipo / Condiciones.

#### Task 2.5: Cierre de fase
- `pnpm verify` (front), `pnpm test` + `pnpm build` (back), migración aplicada en dev, script de códigos ejecutado, navegador: alta, edición, listado con filtros, redirect de «En progreso», ficha y pestañas.

### Fase 3 — Presupuesto tipo hoja ✅ (2026-10-27)

Hallazgos de los Excel que fijan reglas:
- PRIZE: el «Parcial» a veces no es metrado × P.U. (16.0.2: 1 × 4,500 = 5,000; 18.0.x convertidos). ⇒ `directCost` **sobrescribe** a `quantity × unitPrice`.
- PRIZE 4.5.34 (1 × S/ 160) no tiene fórmula y el Excel no lo suma; el sistema sí lo sumaría (se informa al usuario; el fixture lo fija con `directCost: 0` para reproducir el total del Excel).
- Fixture: `markap_backend/test/fixtures/interior-budget-excel.json` (solo números; 45 ítems Markap Spaces, 261 ítems / 21 partidas PRIZE).

Decisiones de fase: las tablas viejas (`interior_project_sections`, `interior_project_line_items`, `interior_line_item_supplier_payments`) se migran en SQL **conservando ids** (los adjuntos guardan el id de partida) y se eliminan. Arquitectura no se toca (tiene sus propias tablas, parser y cálculos compartidos). Toda mutación devuelve la hoja completa recalculada (≤ ~500 filas). Proveedor y abonos se editan en Compras (Fase 4); la hoja muestra costo real.

#### Task 3.1: Dominio de cálculo (puro, TDD)
**Files:** `src/modules/interiorismo/domain/budget/budget-sheet.calculator.ts` + `.spec.ts`, `test/fixtures/interior-budget-excel.json`.
- `computeBudgetSheet(header: BudgetHeaderInput, rows: BudgetRowInput[]): ComputedBudgetSheet`.
- Costo ítem = `directCost ?? round2(quantity × unitPrice) ?? 0`.
- `PER_LINE`: utilidad = round2(costo × (override ?? utilityPct)/100); total = costo + utilidad; IGV = `igvMode=PER_LINE && hasIgv` ? round2(total × igvPct/100) : 0; precio = total + IGV.
- `GLOBAL`: por línea precio = costo; totales: GG = round2(directo × overheadPct/100), utilidad = round2(directo × utilityPct/100).
- Totales: `directCost, utility, overhead, subtotal, igv, total, actualCost, equivalent {currency, amount} | null` (PEN→USD con `total / exchangeRate`; USD/EUR→PEN con `total × exchangeRate`). IGV `GLOBAL` = round2(subtotal × igvPct/100).
- Árbol: orden por `sortOrder`, `depth`, código automático `1`, `1.2`, `1.2.3` salvo `code` manual; subtotales de grupo (costo y precio).
- Tests: Markap Spaces implementación (costo 32,237 · utilidad 6,447.40 · precio 38,684.40), jacuzzi con IGV por línea (IGV 1,483.92 · precio 9,727.92), PRIZE (21 partidas = su total; directo 256,608.02; subtotal 310,495.70; US$ 88,713.06), códigos automáticos/manuales, NOTE sin montos, override de utilidad.

#### Task 3.2: Modelo, migración y repositorio
**Files:** `prisma/models/interiorismo-project-budget.prisma` (reemplaza modelos), migración `20261027140000_interior_budget_tree`, `interior-project-budget.repository.ts` (nuevo contrato), `interior-project-budget-prisma.repository.ts` (reescrito), helper `interior-budget-total.helper.ts` (reemplaza el de interiorismo en execution/finance/reports), seeds (Hortensias, demo, abonos), quitar `prisma/scripts/migrate-interior-budgets-to-project-budget.ts`.
- `InteriorBudget` (cabecera + `version`, `isActive`), `InteriorBudgetRow` (árbol `parentId`, `kind GROUP|ITEM|NOTE`, campos de §4.2 spec), `InteriorBudgetRowSupplierPayment`.
- SQL: crea tablas, copia (un presupuesto v1 activo por proyecto con secciones; sección → GROUP; partida → ITEM con `directCost`; abonos), elimina tablas viejas.

#### Task 3.3: API
- `GET :projectId/budget` → `BudgetSheetDto` (crea v1 vacío si no hay) · `PATCH :projectId/budget` (cabecera) · `POST budget/rows` · `PATCH budget/rows/:rowId` · `POST budget/rows/bulk` · `POST budget/rows/:rowId/move {parentId, index}` · `DELETE budget/rows/:rowId` (con hijos) · `POST budget/rows/:rowId/supplier-payments` · `DELETE budget/supplier-payments/:paymentId` · `POST budget/duplicate-snapshot` (nueva versión activa) · `POST budget/versions/:budgetId/activate` · `GET budget/export.xlsx` · `POST budget/import-excel` (formatos A y B → árbol) · `GET budget/pdf` · settlement/attachments/sync adaptados.
- Contrato HTTP (`test/contracts/http-routes.json`) actualizado solo con estos cambios.

#### Task 3.4: Editor tipo hoja (frontend)
**Files:** `proyecto-presupuesto/domain/budget-sheet.types.ts`, repo/port/composables, `presentation/composables/useBudgetSheet.ts` (+ `tests/budget-sheet-navigation.test.ts` para la lógica pura de indentar/navegar), `components/sheet/BudgetSheet.vue`, `BudgetSheetRow.vue`, `BudgetCell.vue`, `BudgetTotalsBar.vue`, `BudgetHeaderBar.vue`, `BudgetImportModal.vue`; `ProjectBudgetTab.vue` usa `BudgetSheet`.
- Teclado: Enter = fila debajo; Tab/Shift+Tab en descripción = indentar/desindentar; ↑/↓ cambian de fila; Esc revierte la celda. Pegar varias líneas (tabuladas) = `rows/bulk`.
- Guardado por celda al salir (cola secuencial; la respuesta reemplaza la caché).
- Columnas visibles configurables (se guardan en la cabecera).
- Compras/Alertas/Liquidación se adaptan a `rows` (rehechas en Fase 4).

#### Task 3.5: Cierre
- `pnpm test`/`build` (back), `pnpm verify` (front), migración aplicada en dev, importar ambos Excel en el navegador y comparar totales.

### Fase 4 — Compras y Liquidación ✅ (2026-10-27)

Decisión: cada cobro del cliente guarda su **moneda** y un **tipo de cambio** opcional (el del día). La liquidación se expresa en la moneda del presupuesto: cobros en otra moneda se convierten con el TC del cobro o, si no tiene, con el del presupuesto; si no hay TC (o es EUR ↔ USD sin TC a soles) el cobro queda «sin convertir», se muestra aparte y no descuenta del saldo.

- 4.1 Migración `interior_project_payments.currency` (relleno con la moneda del proyecto) + `exchange_rate`; DTOs/use cases/repo de finanzas y detalle de proyecto.
- 4.2 Dominio `computeProjectSettlement(totals, budget, payments)` + tests: misma moneda, PEN→USD, USD→PEN con TC propio, sin TC → sin convertir, pendientes y anulados no cuentan, utilidad = total − costo real.
- 4.3 Liquidación compacta: KPIs (Presupuesto, Cobrado %, Por cobrar / Saldo a favor, Costo real, Utilidad y margen), tabla de cobros con monto en su moneda + equivalente, modal (fecha, concepto, tipo, monto, moneda, TC, estado), lateral con resumen y grupos.
- 4.4 Compras: filtro por proveedor y exportar a Excel (`useExcelExport`).
### Fase 5 — Clientes (`Form` + `FormModal`, ubigeo, detalle con tabs) ✅ (2026-10-27)
- 5.1 `ubigeo-other` y `useClientAddressUbigeo` pasan de Alquileres a `shared` (los usan Alquileres, Ventas e Interiorismo).
- 5.2 Backend Interiorismo (sin tocar el CRM compartido): `GET /interiorismo-projects/clients/summary?clientIds=` → `{ clientId, total, active }[]`; `GET /interiorismo-projects/clients/:clientId/payments` → cobros del cliente en todos sus proyectos (moneda efectiva = la del cobro o la del proyecto).
- 5.3 `InteriorClienteForm` (Persona / Empresa, documento validado, contacto, dirección con ubigeo y «Otros», notas; variante modal) + `InteriorClienteFormModal`; Nuevo/Editar como envoltorios; «Nuevo cliente» desde el formulario de proyecto.
- 5.4 Listado compacto: KPIs compactos, columna Proyectos real (total · activos), exportar.
- 5.5 Detalle: `PageHeader` + KPIs (proyectos, activos, cobrado por moneda) + pestañas Datos · Proyectos · Cobros.
### Fase 6 — Materiales y Proveedores ✅ (2026-10-27)
- 6.1 Migración: `interior_catalog_materials.currency` (PEN) + `description`; `interior_material_purchases.currency` (PEN).
- 6.2 Backend material: moneda/descripción en lista, detalle y escritura; detalle con `suppliers` (vínculos) y `purchases` (compras de catálogo de ese material); `GET …/stats` → `{ total, categories[], outOfStock, withoutSupplier }`.
- 6.3 Backend proveedor: compras con moneda; detalle con `projectItems` (partidas de presupuestos con ese proveedor: proyecto, costo real, abonado, saldo, moneda); lista con `projectItemsCount` y `lastPurchaseAt`; `GET …/stats` → `{ total, withMaterials, withProjects, purchasedThisMonth: CurrencyAmount[] }`.
- 6.4 Front: unidades de medida comunes (`und, m, m², m³, ml, kg, gl, glb, día, pza, rollo, plancha`) en `domain/units.ts`; `InteriorMaterialForm` + `InteriorSupplierForm` (+ `FormModal`); rutas `:id/editar`.
- 6.5 Listados compactos (KPIs, filtros: categoría / stock; con o sin materiales) y fichas con pestañas: material = Datos · Proveedores · Compras; proveedor = Datos · Materiales · Compras (catálogo + partidas de proyectos).
### Fase 7 — Documentos (vista única + `InteriorDocumentsTable` reutilizable) ✅
- 7.1 Backend: `docType` opcional en el listado (todos los tipos); cada fila trae `fileName`, `mimeType`, `sizeBytes` del archivo; `GET /interiorismo-documents/stats?projectId=` → `{ total, byType }`.
- 7.2 Front: `InteriorDocumentsTable` (pestañas segmentadas por tipo con conteo, búsqueda, filtro de proyecto si no viene fijo, abrir/descargar, editar título y tipo, eliminar, paginación) + `DocumentUploadModal` (varios archivos a la vez, título por defecto = nombre del archivo).
- 7.3 Vista única `/interiorismo/documentos?type=`; las rutas `/documentos/<tipo>` redirigen; menú con un solo ítem; la pestaña Documentos de la ficha usa el mismo componente con el proyecto fijo.
- Tipos configurables quedan para la Fase 10 (Parametrización).
### Fase 8 — Calendario + Ejecución en ficha (quitar menú y redirects) ✅ (2026-10-27)

- Backend: CRUD de hitos (`POST/PATCH/DELETE interiorismo-execution/projects/:id/milestones[/:milestoneId]`, `completed` cumple/reabre); contrato HTTP regenerado.
- Compartido: `shared/domain/calendar-grid.ts` (rejilla mes/semana, rangos, agrupación por día; tests en `tests/calendar-grid.test.ts`) y `shared/presentation/components/calendar/` (`CalendarToolbar`, `CalendarMonthView`, `CalendarAgendaList`, tonos).
- Calendario: vistas mes / semana / lista, leyenda por origen con filtro, KPIs compactos, estado en URL, `CalendarEventFormModal` (hora Lima) y `CalendarEventDetailModal` (enlace a la pestaña de la ficha).
- Ejecución: `ProjectExecutionPanel` en la ficha (resumen compacto, avance sugerido por tareas, Tareas tablero/lista/Gantt, Cronograma de hitos, Evidencias, Incidencias; costos antiguos solo consulta — los costos reales viven en Compras). `domain/gantt-layout.ts` con tests.
- Menú sin Ejecución; `/ejecucion` → proyectos `?status=IN_PROGRESS`, `/ejecucion/:id` → ficha `?tab=ejecucion`. Eliminados hub y tablero.
- Arreglos de paso: `FormCombobox` repinta la etiqueta si las opciones llegan después del valor; `FormInput` admite `type="time"`.
### Fase 9 — Reportes + Dashboard (`MonthlyBarChart`, `QuickActionsBar`, `useCurrencyCatalog`) ✅ (2026-10-27, continuada por Codex)

- [x] Backend: presupuesto activo calculado con `computeBudgetSheet`, saldos con `computeProjectSettlement`; agrupación independiente por moneda. Los costos antiguos de Ejecución no se vuelven a sumar y las compras de catálogo se informan aparte.
- [x] API: proyectos creados por período, rentabilidad actual por proyecto, cobranzas confirmadas del período, proveedores por moneda, series mensuales con meses vacíos, indicadores y alertas. Fechas de movimientos en Lima; rango validado (máximo cinco años).
- [x] Reportes: cinco pestañas (Proyectos por período, Rentabilidad, Cobranzas, Compras y proveedores, Indicadores), KPIs compactos, filtros de fecha/moneda y pestaña en URL, gráficos `MonthlyBarChart`, exportación Excel con moneda explícita y hoja de cobros sin convertir.
- [x] Dashboard: `QuickActionsBar`, KPIs compactos, cobranza del mes por moneda, barras por etapa y alertas de saldos, plazos e incidencias.
- [x] Verificación frontend: `pnpm verify` aprobado (arquitectura, tipos, tests, 318 rutas y build).
- [x] Verificación backend: 39 suites y 184 tests aprobados; incluye regresiones de monedas, presupuesto activo, separación de compras de catálogo, saldos históricos, meses vacíos y medianoche de Lima.
- [x] Cierre en navegador tras inicio de sesión manual del usuario: Dashboard, cinco pestañas de Reportes, cobros USD, estado vacío EUR, validación de fechas y exportación Excel. Archivo descargado verificado: seis hojas, columnas de moneda y montos numéricos. No se crearon ni eliminaron datos de negocio durante esta validación.
- [x] Build final backend aprobado tras el último ajuste de validación.

Decisión de interpretación: el período filtra altas de proyectos y movimientos de cobros/compras de catálogo. Rentabilidad, cartera y saldos de proveedores son **actuales**, se rotulan así y no cambian al seleccionar un período histórico. No hay historia de snapshots financieros para reconstruir saldos a una fecha pasada. Los proyectos cancelados se excluyen de los totales de cartera; las filas de rentabilidad permiten consultarlos.

Historial recuperado y pendientes generales: ver `docs/CONTINUIDAD_INTERIORISMO.md`.

### Fase 10 — Configuración (Flujo del negocio + Parametrización)
