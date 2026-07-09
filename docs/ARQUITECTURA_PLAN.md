# Plan de implementación — HITO Arquitectura

> **Objetivo:** Replicar el módulo **Interiorismo (Carolina Zavala)** como **HITO Arquitectura**, con la misma arquitectura limpia (backend) y modular (frontend), adaptando nomenclatura, menús y flujos al negocio de arquitectura.
>
> **Referencia:** `INTERIORISMO_PRESUPUESTOS_PLAN.md` + código en `src/modules/interiorismo/` y `interiorismo-*` en backend.
>
> **Última actualización:** 2026-07-09

---

## Contexto

| | Interiorismo | Arquitectura (HITO) |
|---|-------------|---------------------|
| Slug app | `interiorismo` | `arquitectura` |
| Estado actual | ✅ Operativo completo | 🟡 Solo shell frontend + menús seed |
| Menú principal | Proyectos (presupuesto dentro del detalle) | Cliente → Proyecto → **Presupuestos** → **Cronograma** → Reportes → Config |
| Prefijo códigos | `INT-PRY-####` | `ARQ-PRY-####` |
| Calendario | Calendario | **Cronograma** |

**Decisión:** Misma lógica de negocio que Interiorismo (proyecto → presupuesto por secciones/partidas → compras → liquidación → cronograma → reportes). El menú **Presupuestos** será un hub transversal (listado de proyectos con presupuesto) además del tab dentro del detalle de proyecto.

---

## Convenciones de código

| Capa | Interiorismo | Arquitectura |
|------|-------------|--------------|
| Prisma | `InteriorProject`, `InteriorismoProjectStageConfig` | `ArquitecturaProject`, `ArquitecturaProjectStageConfig` |
| API HTTP | `/interiorismo-projects`, `/interiorismo-config` | `/arquitectura-projects`, `/arquitectura-config` |
| Use cases | `interior-projects/` | `arquitectura-projects/` |
| Frontend | `src/modules/interiorismo/features/*` | `src/modules/arquitectura/features/*` |
| Clientes | API compartida `?applicationSlug=arquitectura` | Igual |

---

## Modelo objetivo (paridad Interiorismo)

```
ArquitecturaProject
  └── ArquitecturaProjectSection[]
        └── ArquitecturaProjectLineItem[]
              └── ArquitecturaLineItemSupplierPayment[]
  └── ArquitecturaProjectPayment[]
  └── ArquitecturaExecutionTask[]        (fase obra)
  └── ArquitecturaCalendarEvent[]        (cronograma)
  └── ArquitecturaProjectDocument[]
  └── GenArchivo (módulo arquitectura-budget)
```

Etapas de ciclo (códigos iguales, etiquetas adaptadas a arquitectura):

`DESIGN` → Anteproyecto · `QUOTE` → Cotización · `APPROVED` → Aprobación · `IN_PROGRESS` → Obra · `FINISHED` → Finalizado

---

## Fases

### Fase 0 — Alineación ✅

- [x] Inventario Interiorismo vs shell Arquitectura
- [x] Este documento (`ARQUITECTURA_PLAN.md`)
- [x] Menús seed existentes (`menus-arquitectura.ts`)

### Fase 1 — Base de datos y configuración ✅

- [x] Prisma: `arquitectura-config.prisma` (etapas + numeración)
- [x] Prisma: `arquitectura-projects.prisma` (cabecera proyecto)
- [x] Relaciones en `applications.prisma` y `clients.prisma`
- [x] Migración SQL manual + `prisma db push`
- [x] Dominio: constantes de etapas, repositorio config, entidades
- [x] Backend: `arquitectura-config` (bootstrap, etapas, numeración)
- [x] Frontend: `features/configuracion/` + ruta real
- [ ] Seeds: etapas y numeración por defecto para slug `arquitectura`

### Fase 2 — Clientes ✅

- [x] Backend: permitir `applicationSlug=arquitectura` en clientes
- [x] Frontend: `features/clientes/` (listado, nuevo, detalle, editar)
- [x] Rutas y menú operativos

### Fase 3 — Proyectos (CRUD) ✅

- [x] Backend: `arquitectura-projects` (list, get, create, update, filtros en ejecución)
- [x] Tipos de proyecto: `RESIDENTIAL`, `COMMERCIAL`, `INSTITUTIONAL`, `MIXED_USE`, `URBAN`
- [x] Frontend: listado, nuevo, editar, detalle (tab Resumen)
- [ ] Dashboard home con KPIs reales (fase 11)

### Fase 4 — Presupuesto por proyecto

- [x] Prisma: `arquitectura-project-budget.prisma`, `arquitectura-finance.prisma`, pagos cliente
- [x] SQL manual: `arquitectura-phase4-budget-finance-postgres.sql`
- [x] Dominio: cálculos reutilizando `interior-project-budget-calculations`
- [x] API: `/arquitectura-projects/:id/budget`, settlement, secciones, partidas, abonos, Excel, PDF, adjuntos
- [x] API finanzas: `/arquitectura-finance` (pagos cliente para liquidación)
- [x] Frontend: `features/proyecto-presupuesto/` + `features/finanzas/` (pagos)
- [x] Detalle proyecto: tabs Presupuesto / Compras / Liquidación
- [x] Compras: proveedor texto libre (sin catálogo hasta fase 9)
- [x] Sync desde ejecución: stub (sin módulo ejecución aún)

### Fase 5 — Hub Presupuestos (menú lateral)

- [x] API `GET /arquitectura-projects/budget-summaries` (listado transversal con totales)
- [x] Vista listado `/arquitectura/presupuestos`
- [x] Flujo “Nuevo presupuesto”: proyecto existente o crear proyecto → tab presupuesto
- [x] Rutas y menú seed alineados (`/presupuestos`, `/presupuestos/nuevo`)

### Fase 6 — Cronograma

- [x] Prisma + API `arquitectura-calendar` (equivalente `interiorismo-calendar`)
- [x] Frontend: `features/cronograma/` (vista calendario en `/arquitectura/cronograma`)
- Feed: eventos manuales + hitos + tareas ejecución + cobros programados

### Fase 7 — Documentos

- [x] Categorías: Contratos, Planos, Renders, Memoria descriptiva, Facturas, Actas
- [x] API `arquitectura-documents` + Prisma `arquitectura_project_documents`
- [x] Frontend: `features/documentos/` (`/arquitectura/documentos/*`)
- [x] Tab documentos en detalle de proyecto (lectura desde API proyecto)

### Fase 8 — Ejecución de obra

- [x] Prisma + API `arquitectura-execution` (tablero, tareas, evidencias, incidencias, costos reales)
- [x] Hitos `arquitectura_project_milestones` (lectura en overview y cronograma)
- [x] Frontend `features/ejecucion/` (`/arquitectura/ejecucion`)
- [x] Sync presupuesto ↔ ejecución (`syncActualCostsFromExecution`)
- [x] Cronograma alimentado con hitos + tareas de ejecución

### Fase 9 — Materiales y proveedores (opcional)

- [x] Prisma: catálogo, proveedores, vínculos, historial compras
- [x] API `/arquitectura-catalog-materials` y `/arquitectura-material-suppliers`
- [x] FK `catalogMaterialId` en costos de ejecución + FK proveedor en partidas presupuesto
- [x] Frontend `features/materiales/` (`/arquitectura/materiales/*`)
- [x] Selector proveedor en compras + material catálogo en tablero ejecución

### Fase 10 — Finanzas / liquidación avanzada

- [x] Panel financiero avanzado (adelantos/cuotas, pagos vinculados, egresos, flujo, rentabilidad)
- [x] Overview con costos reales de ejecución (fix repo finanzas)
- [x] Tab Liquidación: sub-pestañas Liquidación + Ingresos y flujo en detalle proyecto
- [x] Invalidación cronograma al mutar finanzas
- [x] Sync presupuesto ↔ ejecución (Compras, desde Fase 8)

### Fase 11 — Reportes y dashboard

- [ ] API `arquitectura-reports/dashboard`
- [ ] Frontend reportes + home con datos reales

### Fase 12 — Demo, seeds y cierre

- [ ] `demo-arquitectura-*` seeds (cliente, proyecto, presupuesto ejemplo)
- [ ] Builds backend + frontend
- [ ] Actualizar este plan con ✅ por fase

---

## Orden de ejecución recomendado

```
Fase 1 → 2 → 3 → 4 → 5 → 6 → 11 (MVP usable)
         luego 7 → 8 → 9 → 10 → 12
```

**MVP (fases 1–6 + 11):** Config, clientes, proyectos, presupuesto, cronograma, reportes básicos.

---

## Archivos plantilla (Interiorismo → copiar/adaptar)

| Feature | Backend | Frontend |
|---------|---------|----------|
| Config | `interiorismo-config.*` | `features/configuracion/` |
| Clientes | `clients` + slug | `features/clientes/` |
| Proyectos | `interiorismo-projects.*` | `features/proyectos/` |
| Presupuesto | `interiorismo-project-budget.*` | `features/proyecto-presupuesto/` |
| Cronograma | `interiorismo-calendar.*` | `features/calendario/` → `cronograma/` |
| Reportes | `interiorismo-reports.*` | `features/reportes/` |

---

## Estado de avance

| Fase | Estado |
|------|--------|
| 0 | ✅ |
| 1 | ✅ |
| 2 | ✅ |
| 3 | ✅ |
| 4 | ✅ |
| 5 | ✅ |
| 6–10 | ✅ |
| 11–12 | ⏳ Pendiente |
