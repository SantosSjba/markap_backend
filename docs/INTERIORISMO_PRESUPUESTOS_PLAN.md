# Plan de implementación — Presupuestos Interiorismo (modelo Excel Hortensias)

> **Objetivo:** Migrar el módulo de presupuestos al modelo del Excel (proyecto → sección → partida → abonos proveedor + pagos cliente + liquidación), gestionado **dentro del detalle de Proyectos** (sin ítem Presupuestos en el sidebar).
>
> **Última actualización:** 2026-06-19

---

## Decisiones de diseño (cerrar antes de codear)

- [x] **1 presupuesto activo por proyecto** (snapshots vía duplicar, sin tabla de versiones)
- [x] Quitar **Presupuestos** del sidebar
- [x] Tabs en detalle de proyecto: **Presupuesto / Compras / Liquidación**
- [x] Hub **Finanzas** global deprecado → redirige a proyectos / tab Liquidación
- [x] Validar fórmulas con hoja real del Excel (casos con y sin IGV)

---

## Modelo objetivo

```
InteriorProject (cabecera ampliada)
  └── InteriorProjectSection[]          → secciones
        └── InteriorProjectLineItem[]   → partidas
              └── InteriorLineItemSupplierPayment[]  → abonos proveedor
  └── InteriorProjectPayment[]          → pagos cliente (tipo ABONO | PAGO_FINAL | SALDO)
  └── ProjectSettlementDto              → liquidación (calculada, no tabla)
  └── GenArchivo (adjuntos presupuesto, módulo interiorismo-budget)
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

| Excel / diagrama | Estado |
|------------------|--------|
| Cabecera proyecto (ciudad, nivel I/II/III, tiempo, moneda) | ✅ |
| Secciones → partidas (2 niveles) | ✅ |
| Costo directo `budgetedCost` | ✅ |
| Costo real / abonos por partida | ✅ |
| Pagos cliente con `paymentType` | ✅ |
| Liquidación `settlement` | ✅ |
| Presupuestos en sidebar | ✅ Eliminado |
| Import Excel / adjuntos / alertas | ✅ |

---

## Fase 0 — Alineación

- [x] Obtener Excel de referencia (Hortensias) para casos de prueba
- [x] Decisiones de diseño cerradas (ver arriba)

---

## Fase 1 — Base de datos y dominio

### Prisma / schema

- [x] Campos en `InteriorProject`: `city`, `interventionLevel`, `executionTimeNote`, `currency`, `defaultUtilityPct`, `defaultIgvPct`
- [x] `InteriorProjectSection`, `InteriorProjectLineItem`, `InteriorLineItemSupplierPayment`
- [x] `InteriorProjectPayment.paymentType`
- [x] `prisma db push` aplicado en dev
- [x] Tablas legacy `InteriorBudget*` eliminadas tras migración

### Dominio

- [x] `src/domain/interior-project-budget/` + tests vs Excel
- [x] `parse-interior-budget-excel.ts` + tests

### Seeds

- [x] Proyecto Hortensias (`INT-HORTENSIAS-001`) con 37 partidas
- [x] Abonos proveedor demo (`seedHortensiasSupplierPayments`)
- [x] Pago cliente abono S/ 3000

---

## Fase 2 — Backend API

- [x] Repository + use cases presupuesto
- [x] Endpoints CRUD secciones, partidas, abonos proveedor
- [x] `GET settlement`, `GET budget/pdf`
- [x] `POST budget/duplicate-snapshot`
- [x] `POST budget/sync-from-execution`
- [x] `POST budget/import-excel`
- [x] `GET/POST/DELETE budget/attachments`
- [x] Pagos cliente vía API finanzas con `paymentType`

---

## Fase 3 — Frontend: Presupuesto + Compras

- [x] Slice `features/proyecto-presupuesto/`
- [x] Tabs Presupuesto / Compras / Liquidación en detalle proyecto
- [x] Sidebar sin Presupuestos ni Finanzas global
- [x] Selector proveedor catálogo en Compras
- [x] Alertas financieras (`ProjectBudgetAlerts`)

---

## Fase 4 — Liquidación + PDF cliente

- [x] Tab Liquidación con KPIs y CRUD pagos
- [x] Export PDF HTML
- [x] Cabecera en formulario nuevo/editar proyecto

---

## Fase 5 — Migración y limpieza

- [x] Script `pnpm run prisma:migrate:interior-budgets`
- [x] Eliminación código y rutas legacy presupuestos
- [x] Eliminación use cases huérfanos `interior-budgets/`

---

## Fase 6 — Backlog

- [x] Versiones de presupuesto (duplicar snapshot)
- [x] Vincular `supplierId` al catálogo
- [x] Upload adjuntos (GenArchivo + UI)
- [x] Importar desde Excel (.xlsx)
- [x] Sync costo real desde Ejecución
- [x] Alertas saldo proveedor / cobro cliente
- [x] Deprecar hub `/interiorismo/finanzas`

---

## Archivos clave

### Backend

| Área | Ruta |
|------|------|
| Modelos presupuesto | `prisma/models/interiorismo-project-budget.prisma` |
| Modelo proyecto | `prisma/models/interiorismo-projects.prisma` |
| Cálculos | `src/domain/interior-project-budget/` |
| Parser Excel | `src/domain/interior-project-budget/parse-interior-budget-excel.ts` |
| Controller | `src/infrastructure/http/controllers/interiorismo-project-budget.controller.ts` |
| Menús seed | `prisma/seed/data/menus-interiorismo.ts` |

### Frontend

| Área | Ruta |
|------|------|
| Detalle proyecto | `features/proyectos/presentation/views/InteriorismoProyectoDetalleView.vue` |
| Presupuesto | `features/proyecto-presupuesto/` |
| Menús fallback | `config/fallbackMenus.ts` |

---

## Progreso general

| Fase | Estado |
|------|--------|
| Fase 0 — Alineación | ✅ |
| Fase 1 — BD y dominio | ✅ |
| Fase 2 — Backend API | ✅ |
| Fase 3 — FE Presupuesto + Compras | ✅ |
| Fase 4 — Liquidación + PDF | ✅ |
| Fase 5 — Migración y limpieza | ✅ |
| Fase 6 — Backlog | ✅ |

> **Cómo marcar avance:** cambia `- [ ]` por `- [x]` en cada ítem.
