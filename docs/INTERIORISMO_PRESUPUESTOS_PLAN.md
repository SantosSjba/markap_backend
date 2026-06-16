# Plan de implementación — Presupuestos Interiorismo (modelo Excel Hortensias)

> **Objetivo:** Migrar el módulo de presupuestos al modelo del Excel (proyecto → sección → partida → abonos proveedor + pagos cliente + liquidación), gestionado **dentro del detalle de Proyectos** (sin ítem Presupuestos en el sidebar).
>
> **Última actualización:** 2026-06-16

---

## Decisiones de diseño (cerrar antes de codear)

- [ ] **1 presupuesto activo por proyecto** (sin versiones en v1)
- [ ] Quitar **Presupuestos** del sidebar
- [ ] Tabs en detalle de proyecto: **Presupuesto / Compras / Liquidación**
- [ ] Definir destino del hub **Finanzas** global (`/interiorismo/finanzas`): mantener / deprecar / fusionar
- [ ] Validar fórmulas con hoja real del Excel (casos con y sin IGV)

---

## Modelo objetivo

```
InteriorProject (cabecera ampliada)
  └── InteriorProjectSection[]          → secciones
        └── InteriorProjectLineItem[]   → partidas
              └── InteriorLineItemSupplierPayment[]  → abonos proveedor
  └── InteriorProjectPayment[]          → pagos cliente (tipo ABONO | PAGO_FINAL | SALDO)
  └── ProjectSettlementDto              → liquidación (calculada, no tabla)
```

### Fórmulas de negocio

```text
utilidad      = costo_presupuestado × (defaultUtilityPct / 100)   # default 20%
total         = costo_presupuestado + utilidad
precio        = tiene_igv ? total × (1 + igvPct/100) : total

aportes_totales = SUM(abonos_proveedor)
saldo_proveedor = costo_real_comprado - aportes_totales

presupuesto_total = SUM(precio de todas las partidas)
abonos_a_cuenta   = SUM(pagos_cliente donde tipo = ABONO)
pendiente_cobrar  = presupuesto_total - SUM(pagos_cliente pagados)
utilidad_hito     = presupuesto_total - SUM(costo_real_comprado)
```

**Regla:** Los campos calculados (`utilidad`, `total`, `precio`, `saldo_proveedor`, `pendiente_cobrar`, liquidación) **no se guardan en BD**.

---

## Gap vs. sistema actual

| Excel / diagrama | Existe hoy | Acción |
|------------------|------------|--------|
| Cabecera proyecto (ciudad, nivel I/II/III, tiempo, moneda) | Parcial en `InteriorProject` | Ampliar campos |
| Secciones | 4 niveles (Level → Environment → Category → Item) | Simplificar a 2 niveles |
| Partidas con costo directo | `qty × unitPrice` | Cambiar a `budgetedCost` |
| Costo real / abonos por partida | No existe | Crear tablas |
| Pagos cliente | `InteriorProjectPayment` + finanzas | Extender con `paymentType` |
| Liquidación | Parcial en finance overview | Nuevo DTO `settlement` |
| Presupuestos en sidebar | Menú + rutas propias | Quitar y mover a proyecto |

---

## Fase 0 — Alineación

**Duración estimada:** 0.5–1 día

- [ ] Revisión del plan con el equipo
- [ ] Confirmar decisiones de diseño (checkboxes arriba)
- [x] Obtener Excel de referencia (Hortensias) para casos de prueba
- [ ] Listar proyectos/presupuestos demo existentes que migrarán

---

## Fase 1 — Base de datos y dominio

**Duración estimada:** 3–4 días

### Prisma / schema

- [x] Agregar a `InteriorProject`: `city`, `interventionLevel`, `executionTimeNote`, `currency`, `defaultUtilityPct`, `defaultIgvPct`
- [x] Crear modelo `InteriorProjectSection` (`interior_project_sections`)
- [x] Crear modelo `InteriorProjectLineItem` (`interior_project_line_items`)
- [x] Crear modelo `InteriorLineItemSupplierPayment` (`interior_line_item_supplier_payments`)
- [x] Extender `InteriorProjectPayment` con campo `paymentType` (`ABONO` | `PAGO_FINAL` | `SALDO` | `OTHER`)
- [ ] Ejecutar migración / `prisma db push` en desarrollo
- [x] **No eliminar** tablas `InteriorBudget*` aún (convivencia temporal)

### Dominio (backend)

- [x] Crear `src/domain/interior-project-budget/`
- [x] Implementar `computeLineItemPricing(budgetedCost, hasIgv, utilityPct, igvPct)`
- [x] Implementar `computeLineItemSupplierBalance` / `computeLineItemPurchase`
- [x] Implementar `computeProjectSettlement(project, sections, clientPayments)`
- [x] Tests unitarios de todas las fórmulas vs. valores del Excel

### Seeds

- [x] Seed demo proyecto Hortensias con secciones y partidas del Excel
- [ ] Seed abonos proveedor de ejemplo
- [x] Seed pagos cliente de ejemplo (abono S/ 3000)
- [ ] Verificar liquidación del seed coincide con Excel (tras `db push`)

**Entregable:** migración aplicada + tests de cálculo verdes + seed reproducible.

---

## Fase 2 — Backend API

**Duración estimada:** 4–5 días

### Puerto y repositorio

- [x] Crear `InteriorProjectBudgetRepository` (port en `domain/repositories/`)
- [x] Implementar `interior-project-budget-prisma.repository.ts`
- [x] Registrar en `database.module.ts` + `injection-tokens.ts`

### Use cases

- [x] `GetProjectBudgetUseCase` — presupuesto completo con totales calculados
- [x] `CreateProjectSectionUseCase` / `Update` / `Delete`
- [x] `CreateProjectLineItemUseCase` / `Update` / `Delete`
- [x] `CreateLineItemSupplierPaymentUseCase` / `Delete`
- [ ] `ListClientPaymentsUseCase` / `Create` / `Update` / `Delete` (pagos cliente)
- [x] `GetProjectSettlementUseCase`

### HTTP

- [x] DTOs en `infrastructure/http/dtos/interiorismo-project-budget/`
- [x] Controller `interiorismo-project-budget.controller.ts`
- [x] Endpoints:
  - [x] `GET    /interiorismo-projects/:id/budget`
  - [x] `POST   /interiorismo-projects/:id/budget/sections`
  - [x] `PATCH  /interiorismo-projects/:id/budget/sections/:sectionId`
  - [x] `DELETE /interiorismo-projects/:id/budget/sections/:sectionId`
  - [x] `POST   /interiorismo-projects/:id/budget/line-items`
  - [x] `PATCH  /interiorismo-projects/:id/budget/line-items/:itemId`
  - [x] `DELETE /interiorismo-projects/:id/budget/line-items/:itemId`
  - [x] `POST   /interiorismo-projects/:id/budget/supplier-payments`
  - [x] `DELETE /interiorismo-projects/:id/budget/supplier-payments/:paymentId`
  - [ ] `GET/POST/PATCH/DELETE /interiorismo-projects/:id/client-payments`
  - [x] `GET    /interiorismo-projects/:id/settlement`
- [x] Registrar en `http.module.ts`
- [ ] Documentación visible en `/docs` (Swagger/Scalar)

### Compatibilidad (opcional en esta fase)

- [ ] Adapter lectura: presupuestos viejos `InteriorBudget` → formato nuevo
- [ ] Mantener endpoints `/interiorismo-budgets/*` sin romper (marcados deprecated)

**Entregable:** API funcional + settlement correcto vs. Excel.

---

## Fase 3 — Frontend: Presupuesto + Compras

**Duración estimada:** 5–6 días

### Estructura

- [ ] Crear slice `features/proyecto-presupuesto/` (o extender `features/proyectos/`)
- [ ] `domain/` — types, settlement, mirror de cálculos para preview
- [ ] `infrastructure/project-budget.api.repository.ts`
- [ ] `application/useProjectBudget.ts`, `useProjectSettlement.ts`, `useClientPayments.ts`

### Detalle de proyecto

- [ ] Actualizar tabs en `InteriorismoProyectoDetalleView.vue`:
  - [ ] Resumen
  - [ ] **Presupuesto** (nuevo)
  - [ ] **Compras** (nuevo)
  - [ ] **Liquidación** (nuevo — puede ser placeholder hasta Fase 4)
  - [ ] Ejecución
  - [ ] Documentos
  - [ ] Actividad
- [ ] Quitar tab **Presupuestos** (lista que redirige fuera)
- [ ] Evaluar quitar tab **Materiales** y **Finanzas** del detalle

### Vista Presupuesto (cliente)

- [ ] Secciones colapsables
- [ ] CRUD partidas (descripción, costo presupuestado, tiene IGV)
- [ ] Totales en vivo (utilidad, total, precio, presupuesto total)
- [ ] Cabecera: nivel intervención, ciudad, tiempo ejecución

### Vista Compras (interna)

- [ ] Mismas partidas con columnas: costo real, proveedor
- [ ] Modal o inline para abonos proveedor (hasta N abonos)
- [ ] Saldo al proveedor calculado en vivo

### Sidebar y rutas

- [ ] Quitar menú **Presupuestos** de `prisma/seed/data/menus-interiorismo.ts`
- [ ] Quitar de `markap_frontend/.../config/fallbackMenus.ts`
- [ ] Redirect `/interiorismo/presupuestos/:id` → `/interiorismo/proyectos/:projectId?tab=presupuesto`
- [ ] Re-seed menús en dev / script update en prod

**Entregable:** flujo crear proyecto → secciones → partidas → abonos, todo desde detalle de proyecto.

---

## Fase 4 — Liquidación + PDF cliente

**Duración estimada:** 3–4 días

### Vista Liquidación

- [ ] KPIs: presupuesto total, IGV, abonos a cuenta, pendiente por cobrar
- [ ] KPIs: costo real total, abonos proveedor, saldo proveedores, utilidad hito
- [ ] Tabla CRUD pagos cliente
- [ ] Resumen por sección (opcional)

### Export PDF

- [ ] Vista cliente: solo descripción + precio por partida
- [ ] `GET /interiorismo-projects/:id/budget/pdf` (HTML o PDF binario)
- [ ] Botón exportar en tab Presupuesto

### Cabecera proyecto

- [ ] Campos en formulario nuevo/editar: ciudad, nivel intervención, tiempo ejecución, moneda

**Entregable:** paridad con bloque de liquidación del Excel.

---

## Fase 5 — Migración de datos y limpieza

**Duración estimada:** 2–3 días

### Migración

- [ ] Script: `InteriorBudget` (4 niveles) → `Section` + `LineItem`
- [ ] Mapear `quantity × unitPrice` → `budgetedCost`
- [ ] Mapear pagos finanzas existentes → `clientPayments` con `paymentType`
- [ ] Validar totales pre/post migración

### Deprecación backend

- [ ] Deprecar endpoints `/interiorismo-budgets/*`
- [ ] Eliminar use cases y controller viejos (o dejar adapter mínimo)
- [ ] Eliminar tablas `InteriorBudget*` (solo tras validar migración)

### Deprecación frontend

- [ ] Eliminar slice `features/presupuestos/`
- [ ] Eliminar rutas `/interiorismo/presupuestos/*`
- [ ] Actualizar reportes que usan `grandTotal` del presupuesto viejo
- [ ] Actualizar `InteriorismoHomeView` si enlaza a presupuestos

### Documentación

- [ ] Actualizar `README.md` / `ADDING_FEATURES.md` si aplica
- [ ] Marcar este plan como completado o archivar

**Entregable:** un solo modelo en BD y código; sin rutas huérfanas.

---

## Fase 6 — Backlog (opcional)

- [ ] Versiones de presupuesto (duplicar como snapshot)
- [ ] Vincular `supplierId` de partida al catálogo `InteriorMaterialSupplier`
- [ ] Upload de archivos (adjuntos por partida / proyecto)
- [ ] Importar desde Excel (.xlsx)
- [ ] Sincronizar costo real con tab **Ejecución** (`InteriorExecutionActualCost`)
- [ ] Alertas: saldo proveedor pendiente, cobro pendiente al cliente
- [ ] Deprecar hub global `/interiorismo/finanzas` si queda redundante

---

## Archivos clave de referencia

### Backend

| Área | Ruta |
|------|------|
| Modelos actuales presupuesto | `prisma/models/interiorismo-budgets.prisma` |
| Modelo proyecto | `prisma/models/interiorismo-projects.prisma` |
| Finanzas | `prisma/models/interiorismo-finance.prisma` |
| Cálculos actuales | `src/domain/interior-budget/interior-budget-calculations.ts` |
| Controller presupuestos actual | `src/infrastructure/http/controllers/interiorismo-budgets.controller.ts` |
| Menús seed | `prisma/seed/data/menus-interiorismo.ts` |
| Registro HTTP | `src/infrastructure/http/http.module.ts` |

### Frontend

| Área | Ruta |
|------|------|
| Detalle proyecto | `src/modules/interiorismo/features/proyectos/presentation/views/InteriorismoProyectoDetalleView.vue` |
| Slice presupuestos actual | `src/modules/interiorismo/features/presupuestos/` |
| Menús fallback | `src/modules/interiorismo/config/fallbackMenus.ts` |
| Router principal | `src/modules/interiorismo/presentation/router/index.ts` |

---

## Progreso general

| Fase | Estado |
|------|--------|
| Fase 0 — Alineación | 🔄 En curso |
| Fase 1 — BD y dominio | 🔄 Falta `prisma db push` |
| Fase 2 — Backend API | 🔄 CRUD presupuesto listo; faltan pagos cliente |
| Fase 3 — FE Presupuesto + Compras | ⬜ Pendiente |
| Fase 4 — Liquidación + PDF | ⬜ Pendiente |
| Fase 5 — Migración y limpieza | ⬜ Pendiente |
| Fase 6 — Backlog | ⬜ Opcional |

> **Cómo marcar avance:** cambia `- [ ]` por `- [x]` en cada ítem. Actualiza la tabla de progreso (⬜ → 🔄 → ✅).
