# Plan de desarrollo — Sistema Contable (`contabilidad`)

> **Objetivo:** Construir el módulo contable-financiero de MARKAP como **procesos de negocio** (no tablas sueltas), cumpliendo la normativa contable y tributaria peruana aplicable a empresas del grupo, con salida a **libros electrónicos (PLE)** y estados financieros.
>
> **Última actualización:** 2026-05-27  
> **App slug:** `contabilidad` · **Base path:** `/contabilidad`  
> **Estado general:** Fase 15 (multimoneda operativa) completada — **siguiente: Fase 16** (IR completo)

---

## Cómo usar este documento

- Marca `[x]` cada ítem al completarlo.
- Cada fase termina con **build OK** (`npm run build` backend + frontend) salvo que indique lo contrario.
- Las fases siguen **dependencias de negocio y normativas**, no solo el orden visual del menú.
- Antes de implementar tributos/PLE, validar tablas y formatos vigentes en [SUNAT](https://www.sunat.gob.pe) (las resoluciones se actualizan).

---

## Marco normativo de referencia (Perú)

| Tema | Referencia principal | Implicación en MARKAP |
|------|----------------------|------------------------|
| Plan de cuentas | **PCGE** — Res. Ministerial N° 194-2013-EF/10.2013 (MEF) | Plan base seed + personalización por empresa |
| Principios / valoración | **NIC/NIIF** (empresas que aplican) | Diseño extensible; v1 enfocada en PCGE + PYME |
| IGV | DL N° 825, TUO aprobado por DS N° 055-99-EF | 18% default; crédito/débito fiscal |
| Comprobantes de pago | RIS SUNAT (CPE electrónico) | Factura, boleta, NC, ND; serie y numeración |
| Libros electrónicos | **PLE** — R.S. N° 286-2009-MEF y modificatorias | Export `.txt` / ZIP por periodo y libro |
| Detracciones | Ley N° 28111, tabla y tasa SUNAT | SPOT en compras/ventas de bienes/servicios sujetos |
| Retenciones / percepciones | Ley N° 28491 y normas complementarias | Agentes de retención/percepción según perfil empresa |
| Libros obligatorios | Código Tributario, Reglamento del IGV | Diario, Mayor, Inventarios y Balances, Caja y Bancos, Compras, Ventas |
| Moneda funcional | PEN (Soles) | `Decimal` en backend; redondeo 2 decimales en UI |

> **Nota legal:** Este plan es guía técnica de producto. La implementación final debe ser validada por contador/colegio de contadores según el régimen de cada empresa del grupo (RMT, MYPE, general, etc.).

---

## Flujo operativo (referencia)

```text
Configuración (empresa, RUC, PCGE, series, parámetros SUNAT)
    ↓
Plan de cuentas + Periodos + Centros de costo
    ↓
Asientos contables (libro diario) — partida doble
    ↓
Operaciones: Compras / Ventas / Tesorería → generan o vinculan asientos
    ↓
Tributos: IGV, detracciones, retenciones, percepciones
    ↓
Libros electrónicos + export PLE
    ↓
Cierre mensual → Estados financieros + Reportes + Dashboard
    ↓
Fases 13–22 (huecos UI, multimoneda, IR, PLE+, inventario, multi-RUC, CPE, SOL)
    ↓
Fase 23 — Integración con apps MARKAP (al final)
```

---

## Menú actual (sidebar)

| Sección | Rutas base | Estado UI |
|---------|------------|-----------|
| Dashboard | `/contabilidad` | ✅ KPIs reales |
| Contabilidad | plan-cuentas, asientos, periodos, centros-costo, cierre, plantillas | ✅ |
| Tesorería | caja, bancos, conciliaciones, movimientos, transferencias | ✅ |
| Compras | facturas, NC, ND, proveedores, pagos | ✅ |
| Ventas | facturas, boletas, NC, ND, clientes, cobros | ✅ |
| Tributos | IGV, detracciones, retenciones, percepciones | ✅ |
| Tributos | Renta / IR (vista dedicada) | ✅ |
| Libros electrónicos | registro compras/ventas, diario, mayor, caja, bancos, PLE | ✅ |
| Libros electrónicos | PLE libros adicionales SUNAT | ⬜ Fase 17 |
| Reportes financieros | balance, ER, flujos, KPIs, análisis | ✅ |
| Reportes financieros | Export PDF nativo | ✅ Fase 14 |
| Configuración | empresa, series, tipos de cambio | ✅ |
| Configuración | CPE / log electrónico, multi-empresa | ✅ CPE log · multi-empresa Fase 20 |

Seed menú: `prisma/seed/data/menus-contabilidad.ts`  
Rutas frontend: `markap_frontend/src/modules/contabilidad/presentation/router/`

---

## Decisiones de diseño (cerrar antes de codear)

- [ ] **Multi-empresa / multi-RUC:** varias empresas en la app → **Fase 20**
- [x] **Estados del asiento:** `DRAFT` → `POSTED` → `REVERSED`; periodo cerrado bloquea edición/publicación.
- [x] **Partida doble estricta:** publicar solo si debe = haber.
- [x] **Plan de cuentas jerárquico:** código PCGE; cuentas título vs movimiento; no desactivar con movimientos.
- [x] **Moneda funcional:** PEN; tipos de cambio manuales registrados → **multimoneda en asientos: Fase 15** ✅
- [x] **CPE v1:** registro contable + log local (sin OSE/PSE) → **facturación electrónica real: Fase 21**
- [x] **PLE v1:** libros principales + export local → **PLE ampliado + validador: Fase 17**
- [ ] **Integración MARKAP:** eventos de dominio → asientos automáticos → **Fase 23 (al final)**
- [ ] **Auditoría completa:** historial de cambios y trazabilidad → **Fase 20**

---

## Resumen de avance

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Infraestructura y menú | ✅ Completa |
| 1 | Configuración contable | ✅ Completa |
| 2 | Plan de cuentas (PCGE) | ✅ Completa |
| 3 | Periodos y centros de costo | ✅ Completa |
| 4 | Asientos y libro diario | ✅ Completa |
| 5 | Tesorería | ✅ Completa |
| 6 | Compras contables | ✅ Completa |
| 7 | Ventas contables | ✅ Completa |
| 8 | Tributos (IGV, detracciones, retenciones) | ✅ Completa |
| 9 | Libros electrónicos y PLE | ✅ Completa |
| 10 | Cierre mensual y EEFF | ✅ Completa |
| 11 | Reportes y dashboard | ✅ Completa |
| 12 | Completitud normativa Perú (ND, PLE 8.2/3.1, plantillas API) | ✅ Completa |
| 13 | UI y cierre de huecos (APIs sin pantalla) | ✅ Completa |
| 14 | Exportación PDF y reportes avanzados | ⬜ Pendiente |
| 15 | Multimoneda operativa en asientos | ⬜ Pendiente |
| 16 | Impuesto a la renta (IR) completo | ⬜ Pendiente |
| 17 | PLE ampliado y validación SUNAT | ⬜ Pendiente |
| 18 | Inventario permanente contable (20/21) | ⬜ Pendiente |
| 19 | PCGE catálogo completo | ⬜ Pendiente |
| 20 | Multi-empresa y auditoría | ⬜ Pendiente |
| 21 | Facturación electrónica (OSE/PSE) | ⬜ Pendiente |
| 22 | Declaraciones SUNAT (SOL) | ⬜ Pendiente |
| 23 | Integración con apps MARKAP | ⬜ Al final |

### Roadmap pendiente (resumen ejecutivo)

| Fase | Entregable clave | Esfuerzo relativo |
|------|------------------|-------------------|
| **13** | Pantallas que faltan (proveedor ND, plantilla→asiento, renta, log CPE) | Bajo |
| **14** | PDF reportes financieros | Bajo |
| **15** | Asientos en USD con TC | Medio |
| **16** | Módulo renta / IR | Medio |
| **17** | Más libros PLE + validador + historial | Medio |
| **18** | Inventario permanente 20/21 | Alto |
| **19** | Import PCGE completo | Medio |
| **20** | Multi-RUC + auditoría | Alto |
| **21** | CPE electrónico OSE/PSE | Alto (externo) |
| **22** | Envío/preparación SOL | Medio (externo) |
| **23** | Puentes alquileres, ventas, producción, interiorismo | Muy alto |

---

## Fase 0 — Infraestructura y menú

- [x] Aplicación `contabilidad` en seed (`applications.ts`)
- [x] Menú ERP contable (`menus-contabilidad.ts` + `seedContabilidadMenus`)
- [x] `fallbackMenus.ts` y rutas Vue (placeholders)
- [x] `ContabilidadLayout`, `ContabilidadHomeView`, redirecciones rutas obsoletas
- [x] Roles con acceso a la app (seed)
- [x] Prisma: `prisma/models/contabilidad-config.prisma`
- [x] Módulo HTTP `contabilidad-config` (bootstrap + company + settings + series)

---

## Fase 1 — Configuración contable

> Datos maestros de la empresa y parámetros SUNAT. Sin esto no hay plan de cuentas ni PLE.

### Backend

- [x] Modelo `ContabilidadCompanyProfile` por `applicationId`: RUC, razón social, domicilio fiscal, ubigeo
- [x] Régimen tributario, agente de retención/percepción/detracción (flags)
- [x] Parámetros: IGV %, moneda, año fiscal inicio, decimales
- [x] Series de comprobantes (factura, boleta, NC, ND) — numeración por tipo y serie
- [x] Defaults demo Perú vía `ensureDefaults` (MARKAP DEMO S.A.C.)
- [x] API `GET /contabilidad-config/bootstrap`, `PUT company`, `PUT settings`, `PATCH document-series/:key`

### Frontend (`features/configuracion`)

- [x] Tabs: Empresa, Tributario, Series documentales, Numeración
- [x] Validación RUC (dígito verificador)
- [x] Router conectado (`ContabilidadConfiguracionView.vue`)

---

## Fase 2 — Plan de cuentas (PCGE)

> Base del sistema. Cuentas según PCGE con árbol padre/hijo.

### Backend

- [x] Modelo `ContabilidadAccount`: `code`, `name`, `level`, `parentId`, `accountType`, `isMovement`, `isActive`
- [x] Seed PCGE estándar (Res. 194-2013-EF — ~45 cuentas título + movimiento)
- [x] CRUD con restricciones: no desactivar con movimientos; no cambiar código con movimientos
- [x] API `/contabilidad-accounts` (tree, create, update, deactivate)

### Frontend (`features/plan-cuentas`)

- [x] Vista árbol expandible + búsqueda por código/nombre
- [x] Alta/edición cuenta (solo bajo cuentas título)
- [x] Export Excel del plan

---

## Fase 3 — Periodos contables y centros de costo

### Backend

- [x] Modelo `ContabilidadPeriod`: año-mes, estado `OPEN` | `CLOSED`
- [x] Modelo `ContabilidadCostCenter`: código, nombre, activo, jerarquía opcional (`parentId`)
- [x] Apertura automática de los 12 meses al listar un año
- [x] API `GET/PATCH contabilidad-periods`, CRUD `contabilidad-cost-centers`
- [x] Seed demo centros: ADM, VTA, PRD

### Frontend

- [x] Listado periodos con abrir/cerrar (cierre suave por flag)
- [x] CRUD centros de costo
- [x] Selector de periodo activo en layout (`ContabilidadPeriodBar` + localStorage)

---

## Fase 4 — Asientos contables y libro diario

> Núcleo contable. Todo lo demás converge aquí.

### Backend

- [x] Modelo `ContabilidadJournalEntry` + `ContabilidadJournalEntryLine`: fecha, glosa, periodo, estado, líneas (cuenta, debe, haber, CC, auxiliar RUC/doc)
- [x] Validación partida doble; redondeo PEN
- [x] Numeración correlativa por periodo (libro diario)
- [x] Acciones: crear borrador, editar borrador, publicar, reversar, eliminar borrador
- [x] Libro diario consulta con filtros (periodo, estado, fecha, cuenta, CC, búsqueda)
- [x] API `/contabilidad-journal-entries`

### Frontend (`features/asientos`)

- [x] Listado libro diario (`DataTable`, `PageHeader`, `Badge`, filtros con `SearchInput` + `FormSelect`)
- [x] Formulario asiento manual (grilla líneas dinámica, indicador cuadre)
- [x] Detalle asiento + imprimir
- [x] CRUD plantillas de asiento (`/contabilidad-extensions/journal-templates`) — Fase 12
- [x] Aplicar plantilla al crear asiento manual — Fase 13

---

## Fase 5 — Tesorería

> Caja y bancos; movimientos generan asientos automáticos a cuentas 10xx.

### Backend

- [x] Modelo `ContabilidadCashBox`, `ContabilidadBankAccount` (CCI, banco, moneda, cuenta PCGE)
- [x] Modelo `ContabilidadTreasuryMovement`: ingreso/egreso/transferencia, vínculo a asiento
- [x] Transferencias entre caja/bancos (asiento puente automático)
- [x] Conciliación bancaria: saldo libro vs extracto; partidas conciliadas/pendientes
- [x] API `/contabilidad-treasury` (cajas, bancos, movimientos, transferencias, conciliaciones)
- [x] Seed demo: `CAJA-01` (1011) y `BCP-01` (1071)

### Frontend (`features/tesoreria`)

- [x] Caja: saldo, movimientos, ingreso/egreso con modal
- [x] Bancos: cuentas con saldo, alta de cuenta
- [x] Movimientos: `DataTable` con filtros y enlace al asiento
- [x] Conciliación (checklist por periodo + saldo extracto)
- [x] Transferencias entre caja/bancos

---

## Fase 6 — Compras contables

> Registro de compras, cuentas por pagar, pagos a proveedores. Base del **Registro de Compras** (PLE 8.1).

### Backend

- [x] Modelo `PurchaseInvoice` (CPE compra): proveedor RUC, tipo doc, serie-número, fecha, base imponible, IGV, total, detracción
- [x] `PurchaseCreditNote`; estado `PENDING` | `PARTIAL` | `PAID` | `CANCELLED`
- [x] Proveedor contable (`ContabilidadSupplier` por RUC)
- [x] Pago a proveedor → tesorería + asiento (421 vs 10xx)
- [x] Asiento automático plantilla: compra gravada / exonerada / inafecta
- [x] API `/contabilidad-purchases`

### Frontend (`features/compras`)

- [x] Facturas de compra: listado, registro, detalle/asiento
- [x] NC compra
- [x] ND compra (Fase 12)
- [x] Pagos vinculados
- [x] Vista proveedores (saldo CxP)
- [ ] Campos proveedor no domiciliado en UI → **Fase 13**

---

## Fase 7 — Ventas contables

> Facturas/boletas, cuentas por cobrar, cobros. Base del **Registro de Ventas** (PLE 14.1).

### Backend

- [x] Modelo `ContabilidadCustomer`, `ContabilidadSalesInvoice` (FACTURA/BOLETA), `ContabilidadSalesCreditNote`, `ContabilidadSalesCollection`
- [x] Cobro cliente → tesorería IN + asiento (Dr 10xx / Cr 1041)
- [x] Asiento automático venta gravada (Dr 1041 / Cr 70x / Cr 4011); NC inversa
- [x] API `/contabilidad-sales` (customers, invoices, credit-notes, collections)

### Frontend (`features/ventas-contables`)

- [x] Facturas y boletas (vista compartida con filtro por `documentType`)
- [x] NC venta
- [x] ND venta (Fase 12)
- [x] Cobros
- [x] Clientes con saldo CxC (1041)

---

## Fase 8 — Tributos

> Gestión del crédito/débito fiscal y obligaciones accesorias.

### Backend

- [x] **IGV:** resumen mensual crédito vs débito desde compras/ventas; saldo a pagar / a favor (4011)
- [x] **Detracciones:** registro SPOT, cuenta 4018, constancia, tasas SUNAT configurables
- [x] **Retenciones:** IGV y renta (4017)
- [x] **Percepciones:** cobro tesorería + 4011
- [x] Preparación datos **PDT 621** (export estructurado JSON/Excel; sin envío SOL)
- [x] API `/contabilidad-taxes`

### Frontend (`features/tributos`)

- [x] Dashboard IGV del periodo (crédito/débito, saldos)
- [x] Pantallas IGV, detracciones, retenciones, percepciones
- [x] Export PDT 621 (Excel)

---

## Fase 9 — Libros electrónicos y PLE

> Generación de archivos según estructura SUNAT (validación local).

### Backend

- [x] Servicio generación PLE por periodo:
  - [x] 5.1 / 5.2 Libro Diario (`050100`) y Plan de Cuentas (`050200`)
  - [x] 6.1 Mayor (`060100`)
  - [x] 8.1 Registro de Compras (`080100`)
  - [x] 8.2 Registro de Compras no domiciliados (`080200`)
  - [x] 3.1 Inventarios y Balances (`030100`)
  - [x] 14.1 Registro de Ventas (`140100`)
  - [x] 1.1 Caja y Bancos (`010100`)
- [x] Validador: cuadre asientos, campos obligatorios, formato pipe
- [x] API `/contabilidad-ple` (books, generate, download, consulta mayor)

### Frontend (`features/libros-e`)

- [x] Selector periodo + libros a generar (PLE)
- [x] Descarga múltiple archivos `.txt` PLE
- [x] Log de errores/advertencias pre-export
- [x] Vistas consulta: mayor, registros compras/ventas, caja, bancos; diario → asientos

---

## Fase 10 — Cierre mensual y estados financieros

### Backend

- [x] Proceso cierre: bloquea asientos en periodo (checklist + `POST close`)
- [x] Asientos de regularización automáticos en cierre (ingresos/gastos → 591/592)
- [x] Cálculo saldos por cuenta → **Balance General** (activo = pasivo + patrimonio)
- [x] **Estado de resultados** por naturaleza de cuenta (ingresos/gastos PCGE)
- [x] **Estado de flujo de efectivo** (método indirecto v1)
- [x] API `/contabilidad-closing`, `/contabilidad-financial-statements`

### Frontend

- [x] Wizard cierre mensual (checklist: borradores, balance, conciliación bancaria, etc.)
- [x] Pantalla cierre con resumen BG/ER previo al cierre
- [x] Reportes BG, ER y flujo de efectivo con comparativo periodo anterior

---

## Fase 11 — Reportes financieros y dashboard

### Backend

- [x] `GET /contabilidad-reports/dashboard` — KPIs: liquidez, CxC, CxP, IGV periodo, resultado
- [x] Balance de comprobación (`trial-balance`) y análisis financiero (ratios)
- [x] Flujo de caja tesorería (`cash-flow-treasury`)
- [x] Export Excel reportes financieros (`/contabilidad-financial-statements/export/excel`)
- [x] Export PDF nativo → **Fase 14** ✅

### Frontend

- [x] `ContabilidadHomeView` con KPIs reales del periodo
- [x] Reportes: flujo caja, análisis, KPIs + balance de comprobación
- [x] Filtro centro de costo en balance de comprobación

---

## Fase 12 — Completitud normativa Perú

> Ítems pendientes de normativa peruana que no requieren integración con otras apps MARKAP.

### Backend

- [x] Notas de débito compra y venta (ND) con asiento contable
- [x] Proveedor no domiciliado (`countryCode`, `isNonDomiciled`) + PLE 8.2
- [x] Libro Inventarios y Balances PLE 3.1 + snapshots
- [x] Plantillas de asiento recurrentes (`/contabilidad-extensions/journal-templates`)
- [x] Tipos de cambio manuales (`/contabilidad-extensions/exchange-rates`)
- [x] Resumen impuesto a la renta por periodo (`/contabilidad-extensions/income-tax-summary`)
- [x] Log trazabilidad CPE local — API (`/contabilidad-extensions/electronic-document-logs`)
- [x] PCGE seed ampliado (~75 cuentas)
- [x] Serie ND compras `FD02`

### Frontend

- [x] ND compras y ventas (`notas-debito`)
- [x] Plantillas de asiento (`/contabilidad/asientos/plantillas-asiento`)
- [x] Tipos de cambio (`/contabilidad/configuracion/tipos-cambio`)
- [x] Cierre con vista previa de regularización
- [x] Exportar Excel en BG, ER, flujo de efectivo

### Migración

- SQL manual: `prisma/migrations/manual/contabilidad-phase12-peru-completeness-postgres.sql`

---

## Fase 13 — UI y cierre de huecos

> Conectar en pantalla lo que ya existe en backend (Fase 12) y cerrar fricciones operativas del día a día.

### Backend

- [x] DTOs proveedor exponen `countryCode` e `isNonDomiciled` en list/detail
- [x] Endpoint `apply` de plantilla devuelve líneas para borrador de asiento

### Frontend

- [x] **Proveedores:** campos país y checkbox «No domiciliado» en alta/edición
- [x] **Asientos:** selector «Aplicar plantilla» en `ContabilidadAsientoFormView`
- [x] **Renta:** vista `ContabilidadTributosRentaView` (`income-tax-summary`)
- [x] **Log CPE:** vista `ContabilidadCpeLogView` (`electronic-document-logs`)
- [x] Menú Tributos → Renta y Configuración → Trazabilidad CPE
- [x] Seed menú + `fallbackMenus.ts` alineados

### Criterio de cierre

- Usuario puede marcar proveedor no domiciliado, aplicar plantilla en asiento nuevo y consultar resumen renta sin Postman.

---

## Fase 14 — Exportación PDF y reportes avanzados

> Complementar Excel con PDF descargable y mejorar salidas para contador/gerencia.

### Backend

- [x] `GET /contabilidad-financial-statements/export/pdf?periodId=&type=...` (pdfkit)
- [x] Tipos: `balance-sheet`, `income-statement`, `trial-balance`, `cash-flow`
- [x] Cabecera con RUC, razón social, periodo (desde `ContabilidadCompanyProfile`)

### Frontend

- [x] Botón **Exportar PDF** en BG, ER, flujo de efectivo, balance de comprobación (KPIs)
- [x] Análisis financiero: Excel + imprimir/PDF vía navegador
- [x] Hoja de estilos `@media print` en vistas de reporte (fallback sin backend)
- [x] Export Excel de trial-balance (KPIs) y análisis financiero (cliente)

### Criterio de cierre

- Descarga PDF con datos del periodo activo; build OK.

---

## Fase 15 — Multimoneda operativa

> Operaciones en USD (u otra moneda) con conversión a PEN en el asiento publicado.

### Backend

- [x] Campos opcionales en `ContabilidadJournalEntryLine`: `foreignCurrency`, `foreignAmount`, `exchangeRate`
- [x] Al publicar: calcular `debit`/`credit` en PEN desde TC del día (`ContabilidadExchangeRate`) o TC manual en línea
- [x] Validación: moneda extranjera solo si hay TC registrado o `exchangeRate` en línea
- [x] Compras/ventas: moneda, TC y base en ME en factura (conversión a PEN en asiento)
- [x] Tesorería: movimientos en cuenta bancaria USD con conversión

### Frontend

- [x] Columnas moneda extranjera en grilla de asiento manual
- [x] Selector moneda + TC del día al registrar factura en USD (ventas/compras)
- [x] Indicador en listados cuando comprobante es multimoneda
- [x] Catálogo de monedas reutilizado de Ventas (`/properties/currencies`)

### Criterio de cierre

- [x] Asiento publicado en PEN cuadra con importe USD × TC; PLE sigue en PEN.
- [x] Migración SQL: `prisma/migrations/manual/contabilidad-phase15-multicurrency-postgres.sql`

---

## Fase 16 — Impuesto a la renta (IR) completo

> Más allá del resumen API actual: ciclo renta mensual/anual para empresas del régimen general.

### Backend

- [ ] Modelo `ContabilidadIncomeTaxPeriodSummary` (o ampliar extensions): base imponible, gastos deducibles, pagos a cuenta, saldo
- [ ] Cálculo desde ER + ajustes manuales + saldo cuenta `4012`
- [ ] Retenciones renta acumuladas (desde `ContabilidadRetention` tipo RENTA)
- [ ] Export borrador declaración anual (estructura JSON/Excel; sin envío SOL — eso es Fase 22)
- [ ] API `/contabilidad-taxes/renta` o ampliar `/contabilidad-extensions/income-tax`

### Frontend

- [ ] `ContabilidadTributosRentaView` completa: tabs Resumen periodo, Pagos a cuenta, Retenciones, Ajustes
- [ ] Gráfico evolución resultado acumulado vs impuesto estimado
- [ ] Enlace a ER y cuenta 4012

### Criterio de cierre

- Contador puede revisar base renta del periodo y exportar borrador sin integración externa.

---

## Fase 17 — PLE ampliado y validación SUNAT

> Libros adicionales según régimen y validación más estricta pre-envío.

### Backend

- [ ] Registrar libros PLE adicionales según necesidad del cliente (validar en SUNAT vigente):
  - [ ] 5.3 Libro diario simplificado (`050300`) — si aplica RMT/MYPE
  - [ ] 5.4 Detalle del libro diario (`050400`)
  - [ ] 8.3 / 8.4 Registros de compras complementarios (si aplica)
  - [ ] Otros códigos que exija el régimen de la empresa demo
- [ ] Modelo `ContabilidadPleExportLog`: periodo, libros, usuario, hash archivo, issues
- [ ] Validador local ampliado: longitudes de campo, RUC, fechas, correlativo según estructura oficial
- [ ] Generación ZIP de todos los libros del periodo en un solo archivo
- [ ] Incluir NC/ND en registros 8.1 y 14.1 si aún no están explícitos

### Frontend

- [ ] PLE: checklist de libros obligatorios según perfil tributario de la empresa
- [ ] Historial de exportaciones PLE
- [ ] Vista previa de líneas con error antes de descargar

### Criterio de cierre

- Generación ZIP periodo completo; log de export; validador bloquea errores críticos.

---

## Fase 18 — Inventario permanente contable (cuentas 20/21)

> Inventario valorizado en contabilidad, independiente de la integración con producción (eso refina en Fase 23).

### Backend

- [ ] Modelo `ContabilidadInventoryItem` (código, descripción, cuenta 20x, unidad, método costo PEPS/PROMEDIO)
- [ ] `ContabilidadInventoryMovement`: entrada, salida, ajuste; cantidad, costo unitario, asiento vinculado
- [ ] Asientos automáticos: entrada (Dr 20 / Cr 421 o 61), salida (Dr 69 / Cr 20)
- [ ] Reporte kardex por ítem y saldo valorizado al cierre
- [ ] Alimentar PLE 3.1 con saldos reales de inventario (no solo trial balance de cuentas)

### Frontend

- [ ] `features/inventario-contable/`: ítems, movimientos, kardex, reporte valorizado
- [ ] Menú Contabilidad → Inventario permanente

### Criterio de cierre

- Entrada y salida de mercadería generan asiento y actualizan saldo 20; kardex consultable.

---

## Fase 19 — PCGE catálogo completo

> Pasar del seed esencial (~75 cuentas) a catálogo PCGE importable por clase.

### Backend

- [ ] Archivo seed o import JSON con PCGE completo (Res. 194-2013-EF) por clases 1–9
- [ ] `POST /contabilidad-accounts/import-pcge?classes=1,2,3` — merge sin duplicar códigos existentes
- [ ] Flag `isSystem` en cuentas importadas vs personalizadas

### Frontend

- [ ] Plan de cuentas: acción «Importar PCGE» (selector de clases)
- [ ] Indicador cuentas sistema vs personalizadas

### Criterio de cierre

- Importación idempotente de al menos clases 1–7 sin romper cuentas con movimiento.

---

## Fase 20 — Multi-empresa y auditoría

> Holding con varios RUC y trazabilidad de cambios.

### Backend

- [ ] Modelo `ContabilidadLegalEntity` (o `AccountingCompany`): RUC, razón social, vinculado a `applicationId` + selector activo por usuario/sesión
- [ ] Migrar `ContabilidadCompanyProfile` a entidad multi-RUC o `companyId` en tablas operativas
- [ ] Modelo `ContabilidadAuditLog`: entidad, acción, userId, payload diff, timestamp
- [ ] Registrar en audit: publicar/reversar asiento, cierre periodo, cambios maestros

### Frontend

- [ ] Selector de empresa/RUC en `ContabilidadLayout` (si el usuario tiene acceso a varias)
- [ ] Pantalla consulta auditoría (filtros por fecha, usuario, tipo)

### Criterio de cierre

- Dos empresas demo con datos aislados; log de publicación de asiento visible.

---

## Fase 21 — Facturación electrónica (OSE/PSE)

> Emisión real de CPE ante SUNAT. Requiere proveedor certificado y credenciales.

### Backend

- [ ] Generación XML UBL 2.1 (factura, boleta, NC, ND)
- [ ] Firma digital (certificado `.pfx` en vault seguro, no en repo)
- [ ] Integración OSE/PSE configurable (Nubefact, Bizlinks, SUNAT directo, etc.)
- [ ] Estados: `DRAFT` → `SENT` → `ACCEPTED` / `REJECTED`; almacenar CDR y hash
- [ ] Vincular respuesta SUNAT al comprobante contable y al log CPE (Fase 13)

### Frontend

- [ ] Configuración → Facturación electrónica: proveedor, serie, certificado
- [ ] Botón «Emitir electrónicamente» en factura venta; badge estado SUNAT
- [ ] Descarga XML/CDR

### Criterio de cierre

- Emisión en ambiente beta SUNAT de al menos una factura de prueba (con credenciales del cliente).

### Dependencias externas

- Proveedor OSE/PSE contratado; certificado digital vigente.

---

## Fase 22 — Declaraciones SUNAT (SOL)

> Envío o preparación asistida de obligaciones mensuales/anuales.

### Backend

- [ ] Almacén seguro credenciales SOL (encriptado)
- [ ] Envío PDT 621 desde datos ya exportados (si API SUNAT disponible; si no, paquete listo para carga manual asistida)
- [ ] Preparación PLAME (estructura datos; envío según viabilidad API)
- [ ] Log de declaraciones: periodo, tipo, estado, respuesta

### Frontend

- [ ] Tributos → Declaraciones SOL: wizard PDT 621 por periodo
- [ ] Estado última declaración y errores SUNAT

### Criterio de cierre

- Al menos export + flujo guiado de carga; envío automático si hay API y credenciales de prueba.

### Nota

- El envío 100% automático depende de APIs SUNAT; mantener siempre export manual como respaldo.

---

## Fase 23 — Integración con apps MARKAP (al final)

> La contabilidad recibe hechos económicos de otros módulos; no duplica operación comercial.  
> **Implementar solo después de Fases 13–22** (o cuando el negocio priorice un puente puntual).

| App origen | Evento ejemplo | Asiento sugerido |
|------------|----------------|------------------|
| `alquileres` | Cobro de alquiler | Dr 10 / Cr 70 (+ IGV) |
| `ventas` (inmob.) | Separación / cierre venta | CxC, ingreso diferido, comisiones |
| `produccion` | Factura cotización aceptada / entrega | CxC, ingreso, costo de ventas |
| `interiorismo` | Cobro proyecto / pago proveedor | CxC / CxP, ingreso por etapas |
| `produccion` compras | OC recibida / pago proveedor | Compras + IGV crédito |

### Backend

- [ ] `ContabilidadIntegrationTemplate`: app origen, evento, líneas de asiento (cuenta, debe/haber, %)
- [ ] `ContabilidadIntegrationEvent` + cola o hook post-operación en cada app (feature flag por app)
- [ ] Idempotencia (`sourceApp`, `sourceId`, `eventType`) — no duplicar asiento
- [ ] Puente inventario producción ↔ cuentas 20/21 (refina Fase 18)

### Frontend

- [ ] Configuración → Integraciones: mapeo cuentas por app/evento
- [ ] Log de asientos generados automáticamente (filtro por app, fecha, estado)
- [ ] Reprocesar / revertir integración fallida

### Integraciones por app (orden sugerido dentro de Fase 23)

| Orden | App | Eventos prioritarios |
|-------|-----|----------------------|
| 1 | `alquileres` | Cobro alquiler, gastos mantenimiento |
| 2 | `ventas` (inmob.) | Separación, cierre, comisiones |
| 3 | `produccion` | Cotización facturada, entrega, costo ventas, OC/pago proveedor |
| 4 | `interiorismo` | Cobro etapa, pago proveedor material |

---

## Orden recomendado de implementación

```text
0–12  ✅ Completadas (ver secciones anteriores)
  → 13 UI y huecos (proveedor ND, plantilla en asiento, renta borrador, log CPE)
  → 14 Export PDF + reportes avanzados
  → 15 Multimoneda en asientos
  → 16 IR completo
  → 17 PLE ampliado + validador + historial
  → 18 Inventario permanente 20/21
  → 19 PCGE catálogo completo
  → 20 Multi-empresa + auditoría
  → 21 Facturación electrónica OSE/PSE
  → 22 Declaraciones SOL
  → 23 Integración MARKAP (al final)
```

---

## Modelo de datos (borrador Prisma)

```text
ContabilidadCompanyProfile / ContabilidadLegalEntity (Fase 20)
ContabilidadAccount (árbol PCGE + import completo Fase 19)
ContabilidadPeriod, CostCenter
JournalEntry + JournalEntryLine (+ multimoneda Fase 15)
CashBox, BankAccount, TreasuryMovement, BankReconciliation
PurchaseInvoice, PurchaseCreditNote, PurchaseDebitNote, PurchasePayment
SalesInvoice, SalesCreditNote, SalesDebitNote, SalesCollection
TaxDetraction, TaxRetention, TaxPerception, IgvPeriodSummary, IncomeTaxPeriodSummary (Fase 16)
ContabilidadExchangeRate, ContabilidadJournalTemplate
ContabilidadInventoryBalanceSnapshot, ContabilidadInventoryItem/Movement (Fase 18)
ContabilidadElectronicDocumentLog (+ estados OSE Fase 21)
ContabilidadPleExportLog (Fase 17)
ContabilidadAuditLog (Fase 20)
ContabilidadIntegrationTemplate + IntegrationEvent (Fase 23)
```

Archivos sugeridos: `prisma/models/contabilidad-*.prisma` (dividir por subdominio como en `produccion`).

---

## Referencias en el repo

| Área | Ubicación |
|------|-----------|
| Menú seed | `prisma/seed/data/menus-contabilidad.ts` |
| Rutas frontend | `markap_frontend/src/modules/contabilidad/presentation/router/` |
| Fallback menú | `markap_frontend/src/modules/contabilidad/config/fallbackMenus.ts` |
| Plan similar | `docs/PRODUCCION_MUEBLES_PLAN.md` |
| Cómo agregar features | `docs/ADDING_FEATURES.md` |

---

## Riesgos y dependencias externas

| Tema | Fase | Nota |
|------|------|------|
| OSE/PSE y certificado digital | 21 | Requiere contrato con proveedor y `.pfx` del cliente |
| Envío SOL automático | 22 | Depende de APIs SUNAT; siempre mantener export manual |
| NIIF / consolidación grupos | 19+ | Opcional; PCGE es base Perú |
| Validación PLE oficial | 17 | Comparar con validador SUNAT al actualizar estructuras |
| Multimoneda | 15 | TC SUNAT diario (opcional: integrar API SBS) |
| Inventario + stock producción | 18 + 23 | Contable en 18; sincronización stock en 23 |

## Fuera de alcance indefinido

- Consolidación NIIF de grupos internacionales
- Nómina / PLAME completo como módulo RRHH (solo preparación datos en Fase 22)
- Contabilidad analítica avanzada más allá de centros de costo

---

## Notas técnicas

- Backend: clean architecture (domain → use cases → infrastructure → HTTP).
- Frontend: arquitectura modular por feature (`features/<nombre>/`).
- Montos: `Decimal` en Prisma; nunca `float` para importes tributarios.
- Zona horaria reportes: `America/Lima`.
- Cada fase nueva: actualizar este `.md` marcando checkboxes y la tabla **Resumen de avance**.
