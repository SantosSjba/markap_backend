# Reestructuración Interiorismo (Carolina Zavala) — Diseño

> **Fecha:** 2026-10-27
> **Alcance:** módulo `interiorismo` (frontend + backend). El módulo `arquitectura` (espejo) queda fuera.
> **Referencia de patrones:** Ventas y Alquileres (listados compactos, `Form` + `FormModal`, `StatsCard compact`, multi-moneda, códigos descriptivos, Configuración con Flujo + Parametrización).
> **Excel fuente:** `PRESUPUESTO CORTO MARKAP SPACES 2.0.xlsx` y `PRESUPUESTO REMODELACIÓN PRIZE FINAL.xlsx`.

---

## 1. Objetivo y criterios de éxito

Llevar Interiorismo al mismo nivel que Ventas y Alquileres y permitir que la clienta registre sus presupuestos en el sistema **igual que en sus Excel**: fila por fila, con grupos anidados, costos, utilidad, IGV y costo real.

Éxito =
1. Ambos Excel se pueden reproducir (importar o tipear) en el editor y dan **los mismos totales**: Markap Spaces Hoja2 = S/ 38,684.40 · PRIZE costo directo = S/ 256,608.02, subtotal = S/ 310,495.70.
2. Todas las pantallas del módulo siguen los patrones compactos de Ventas y Alquileres y muestran montos en su moneda (PEN / USD / EUR).
3. No se pierden datos existentes (secciones, partidas, abonos y pagos actuales migran).

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| "Estilo Jira" | **Hoja editable por filas** (grilla tipo Excel, sin fechas por ítem) |
| Margen | **Ambos modos** por presupuesto: `POR_LINEA` (Markap Spaces) o `GLOBAL` (PRIZE); el ítem puede sobrescribir su % |
| Código proyecto | `PROYECTO-<año>-<TIPO>-<DISTRITO>-<APELLIDO>`, sufijo `-2`, `-3` si se repite |
| Ejecución | Sale del menú; vive como **pestaña de la ficha**. Costos reales se consolidan en Compras |
| "En progreso" | Sale del menú; redirige a listado `?status=IN_PROGRESS` |
| Configuración | Se elimina pestaña "Módulo Interiorismo"; quedan **Flujo del negocio** + **Parametrización** |
| Tarjetas | Ficha = `BaseTabs` suelto + vista; `BaseCard`/`FormSectionCard` solo donde agrupa contenido |
| Monedas | PEN, USD, EUR en proyecto, presupuesto, pagos, compras, catálogo, reportes |

## 3. Análisis de los Excel

### Formato A — Markap Spaces 2.0 (implementación)
- Jerarquía: **Nivel** (PRIMER NIVEL) → **Ambiente** (Sala, Comedor, Patio…) → **Categoría** (Estructurales, Mobiliario, Biofilia, Eléctricos…) → ítem.
- Columnas: `Costo`, `Costo real` (Hoja2 (2)), `Utilidad = 20% × Costo`, `Total = Costo + Utilidad`, `IGV = 18% × Total` (solo algunas líneas), `Precio = Total + IGV`.
- Ítems sin costo (pendientes de cotizar, "Obsequio"); costos escritos como fórmula `=95*2` (cantidad × unitario implícito).
- Columnas libres de notas técnicas (P–T).
- Bloque separado "Diseño de interiores 120 m² (S/54 por m²)" con precio fijo.

### Formato B — PRIZE (obra, estilo APU)
- Cabecera: `Presupuesto N° 29.08-2025`, `Ejecuta`, `Empresa`, `Plazo de ejecución`, `Fecha`.
- Jerarquía: **Nivel** (PRIMER/SEGUNDO NIVEL) → **Partida** (A, B, 1, 2 … 20) → ítem con código `1.0.1`.
- Columnas: `Unidad`, `Metrado`, `P.U.`, `Parcial = Metrado × P.U.`, `Total` por partida.
- Cierre: `Costo directo` → `Gastos generales y utilidad 20% + 1%` (global) → `Subtotal S/` → `Subtotal US$ (TC 3.50 – fecha)` → "Costos no incluyen IGV".
- Anexo de detalle "ya incluido en partidas" (informativo, no suma).

## 4. Modelo de datos (backend)

### 4.1 `InteriorProject` (cambios)
- `code` pasa a descriptivo (util `interior-project-code.util.ts`, igual que `sale-process-code.util.ts`).
- Nuevos: `district`/ubigeo (alineado a Alquileres), `exchangeRate` opcional.
- `currency` ∈ `PEN | USD | EUR`.
- `defaultUtilityPct`, `defaultIgvPct` se mantienen; se agrega `defaultOverheadPct` (GG).
- Se migra `INT-PRY-xxxx` → código nuevo (script idempotente).

### 4.2 Presupuesto (reemplaza Section/LineItem)

```
InteriorBudget (1 activo por proyecto + snapshots)
  number, version, issuedAt, executionTerm, executedBy, status (DRAFT|SENT|APPROVED)
  currency, exchangeRate, exchangeRateDate
  marginMode (PER_LINE|GLOBAL), utilityPct, overheadPct
  igvMode (PER_LINE|GLOBAL|NONE), igvPct
  terms (texto), visibleColumns (json)
  └── InteriorBudgetRow[]  (árbol por parentId, sortOrder)
        kind: GROUP | ITEM | NOTE
        code (auto 1 / 1.2 / 1.2.3, editable), description
        ITEM: unit, quantity, unitPrice, directCost (si no hay qty×PU),
              actualCost, utilityPctOverride, hasIgv, supplierId,
              status (PENDING|QUOTED|PURCHASED|GIFT), note
        └── InteriorBudgetRowSupplierPayment[] (abonos sin límite)
InteriorProjectPayment (cobros cliente, + currency)
```

### 4.3 Fórmulas (no se guardan)
```
costo_item     = quantity × unitPrice   (si ambos)  |  directCost
PER_LINE:  utilidad = costo × (override ?? utilityPct)
           total    = costo + utilidad
           igv      = (igvMode=PER_LINE && hasIgv) ? total × igvPct : 0
           precio   = total + igv
GLOBAL:    costo_directo = Σ costo_item
           gg_utilidad   = costo_directo × (overheadPct + utilityPct)
           subtotal      = costo_directo + gg_utilidad
           igv           = igvMode=GLOBAL ? subtotal × igvPct : 0
total_grupo = Σ hijos ;  equivalente = total / exchangeRate (o ×) en la otra moneda
saldo_proveedor = actualCost − Σ abonos
pendiente_cobrar = total_presupuesto − Σ cobros pagados
```
Dominio puro en `src/domain/interior-budget/` con tests contra los totales de §1.

### 4.4 Migración
Section → `GROUP`, LineItem → `ITEM` (`budgetedCost`→`directCost`, `actualPurchaseCost`→`actualCost`), abonos → abonos. Proyecto con `marginMode=PER_LINE`. Script `prisma:migrate:interior-budget-tree`, tablas viejas se eliminan al final.

### 4.5 API
- `GET/PATCH /projects/:id/budget` (cabecera), `POST .../budget/rows`, `PATCH .../rows/:rowId` (celda), `POST .../rows/bulk` (pegado desde Excel), `POST .../rows/:rowId/move` (reordenar / indentar), `DELETE .../rows/:rowId`.
- `POST .../budget/import-excel` (detecta formato A o B), `GET .../budget/export.xlsx`, `GET .../budget/pdf`, `POST .../budget/duplicate-snapshot`.
- Abonos: CRUD bajo `rows/:rowId/supplier-payments`.

## 5. Frontend por área

### 5.0 Base compartida
- `useCurrencyCatalog` → `shared` (hoy en Alquileres y Ventas); reemplaza `formatSol` / `formatPen`.
- `DashboardAccionesRapidas` → `shared/presentation/components/dashboard/QuickActionsBar.vue`. Los `DashboardBarChart` de Ventas/Alquileres difieren demasiado; Interiorismo usa el ya compartido `MonthlyBarChart`.
- Util de código descriptivo compartible (`normalizePart`, `suggestOwnerSurname`).

### 5.1 Menú final
Dashboard · Clientes (Listado / Nuevo) · Proyectos (Listado / Nuevo) · Materiales (Catálogo / Proveedores) · Calendario · Documentos · Reportes · Configuración.

### 5.2 Proyectos
- **Listado** (patrón `VentasProcesosView`): KPIs compactos (activos, cotización, ejecución, finalizados, cartera por moneda); tabla con punto de estado, código + nombre, cliente + documento, tipo/nivel, etapa, presupuesto (moneda), % cobrado / avance, fechas; filtros búsqueda / etapa / tipo / responsable; `ActionsDropdown`.
- **Formulario único** `InteriorProyectoForm.vue` (+ `InteriorProyectoFormModal` opcional): secciones Cliente (combobox + crear en `ClienteFormModal`), Datos, Ubicación (ubigeo), Plazos, Equipo, Condiciones económicas (moneda, TC, % utilidad, % GG, modo margen, modo IGV). Preview de código en vivo.
- **Ficha**: `PageHeader` (back, badges, acciones) → KPIs compactos → `BaseTabs` sin tarjeta → vista. Pestañas: Resumen · Presupuesto · Compras · Liquidación · Ejecución · Documentos · Actividad. Cada pestaña en su componente (`ProjectSummaryTab`, …); estado en `?tab=`.

### 5.3 Presupuesto — editor tipo hoja (`BudgetSheet`)
- Barra: N° / versión / estado, modo margen, IGV, moneda + TC, columnas visibles, Importar Excel, Exportar (Excel/PDF), Duplicar versión.
- Grilla: columnas Código · Descripción · Und · Metrado · P.U. · Costo · Costo real · Util.% · IGV · Total · Precio · Proveedor · Estado · Nota (según modo/visibles).
- Teclado: Enter = nueva fila debajo; Tab/Shift+Tab en descripción = indentar/desindentar; flechas navegan; Ctrl/Cmd+D duplica; Supr elimina (confirmación).
- Mouse: arrastrar para reordenar, colapsar grupos, menú contextual de fila.
- Pegar bloque desde Excel → `rows/bulk`.
- Autoguardado por celda (optimista con rollback y toast de error).
- Pie fijo: costo directo · GG+utilidad · subtotal · IGV · total · equivalente en otra moneda.
- Componentes: `BudgetSheet`, `BudgetSheetRow`, `BudgetCell` (texto/número/select), `BudgetTotalsBar`, `BudgetHeaderForm`, `BudgetImportModal`; lógica en `useBudgetSheet` (navegación, foco, cola de guardado).

### 5.4 Compras
Tabla compacta derivada de ítems: ítem / grupo, proveedor, presupuestado, real, desviación, abonado, saldo, estado; filtros por proveedor/estado; modal de abonos ilimitados; KPIs compactos.

### 5.5 Liquidación
KPIs compactos por moneda (presupuesto, cobrado, pendiente, costo real, utilidad); tabla de cobros (abono / pago final / saldo) con modal; alertas (`ProjectBudgetAlerts`) compactas.

### 5.6 Ejecución (en ficha)
Avance global, tareas (lista compacta con estado), incidencias y evidencias reutilizando lo del tablero actual; hitos. Se eliminan las rutas `/ejecucion` (redirect a la ficha `?tab=ejecucion`).

### 5.7 Clientes
Patrón Alquileres: `InteriorClienteForm` + `InteriorClienteFormModal` (ubigeo), listado compacto con KPIs, detalle con tabs Datos / Proyectos / Pagos.

### 5.8 Materiales y Proveedores
Listados compactos, `Form` + `FormModal`, moneda y unidad (catálogo de unidades), historial de compras enlazado a proyectos, proveedor usable desde Compras.

### 5.9 Documentos
Una sola vista `/documentos`: tabs segmentadas por tipo (o "Todos"), filtro proyecto, búsqueda, `FileDropzone`, abrir/descargar con `useOpenStoredFile`. Componente `InteriorDocumentsTable` reutilizado en la ficha (proyecto fijo). Rutas antiguas `/documentos/<tipo>` redirigen a `?type=`. Tipos de documento configurables.

### 5.10 Calendario
Toolbar compacta (mes / semana / lista, hoy, filtros proyecto y responsable), leyenda por origen (manual, hito, tarea, cobro), modal de evento reutilizable, enlace a la ficha del proyecto.

### 5.11 Reportes
Patrón Ventas: KPIs compactos + tabs Proyectos por periodo · Rentabilidad (presupuesto vs real) · Cobranzas · Compras y proveedores · Indicadores; `MonthlyBarChart`, exportar Excel, todo por moneda.

### 5.12 Dashboard
Patrón Alquileres: KPIs compactos, cobranza del mes, proyectos por etapa (barra), alertas (saldo proveedor, cobros pendientes, proyectos atrasados), acciones rápidas.

### 5.13 Configuración
- **Flujo del negocio**: paso a paso Cliente → Proyecto → Presupuesto → Compras → Liquidación (enlaces), etapas y estados.
- **Parametrización**: etapas, tipos de proyecto, niveles de intervención, unidades de medida, categorías de partida, tipos de documento, valores por defecto (% utilidad, % GG, % IGV, moneda, modo margen).

## 6. Fases de ejecución

1. Base compartida (moneda, componentes dashboard, util de código)
2. Proyectos: código + migración, formulario, listado, ficha con tabs, quitar "En progreso"
3. Presupuesto: modelo + migración + dominio/tests, API, editor tipo hoja, import/export
4. Compras + Liquidación
5. Clientes
6. Materiales + Proveedores
7. Documentos
8. Calendario + Ejecución en ficha
9. Reportes + Dashboard
10. Configuración

Cada fase: typecheck + tests de backend/front, verificación en navegador, cambios **sin commit** (lo hace el usuario).

## 7. Riesgos
- **Editor tipo hoja**: es la pieza más compleja. Se mitiga con la lógica aislada en `useBudgetSheet` + dominio puro testeado, y tolerando ~500 filas sin virtualizar (PRIZE ≈ 300).
- **Migración de códigos**: puede afectar referencias externas (PDF ya enviados). El código viejo se guarda en `legacyCode`.
- **Datos multi-moneda en reportes**: nunca se suman monedas distintas (igual que Ventas).


## 8. Aclaración del flujo catálogo → presupuesto → compras (2026-10-27)

Ajuste solicitado por el usuario tras revisar el presupuesto y la partida «Sistema de chimenea de alcohol»:

- Un grupo organiza niveles, ambientes o categorías; una partida puede representar un material, producto, servicio o trabajo completo. No se debe denominar material a cualquier fila del presupuesto.
- Se conserva el directorio bajo «Catálogo y proveedores», antes de Proyectos. El catálogo reúne materiales y productos físicos recurrentes, con precio de referencia, stock y proveedores. No es requisito llenar el catálogo para presupuestar.
- «Desde catálogo» crea una partida con una copia editable de nombre, unidad y costo unitario. Se puede elegir el grupo de destino y, opcionalmente, uno de los proveedores vinculados. No se crea un vínculo vivo: cambios posteriores al catálogo no actualizan presupuestos anteriores. Las partidas libres y los Excel existentes siguen funcionando.
- Si el catálogo tiene otra moneda, se exige escribir el costo en la moneda del presupuesto; no se copia un número como si fuera la misma moneda ni se aplica un tipo de cambio implícito.
- La ficha muestra «Compras y contrataciones»: las mismas partidas se consultan para registrar costo real, proveedor/contratista, estado y abonos; no son compras confirmadas por aparecer allí. Ingresar un costo real no cambia automáticamente el estado a Comprado.
- Cada partida admite un proveedor. Trabajos que necesitan varios proveedores se desglosan como grupo con partidas separadas (ejemplo: chimenea, materiales e instalación). El costo del grupo se calcula con sus hijos; no duplicar el total como una partida adicional.
- Costos sin proveedor permanecen en la rentabilidad y se avisan por separado. No se consideran deuda atribuida a proveedores hasta identificar uno; se conservan los saldos de partidas con abonos históricos aunque actualmente no tengan proveedor.
- Seleccionar una referencia no registra compra, no descuenta stock y no modifica el catálogo. No hay cambios de esquema, migraciones ni reclasificación automática de datos existentes en este ajuste.

Implementación reutiliza FormInput, FormSelect, FormCombobox, BaseModal, los formularios modales existentes de materiales/proveedores, la cola del editor y las APIs actuales.
