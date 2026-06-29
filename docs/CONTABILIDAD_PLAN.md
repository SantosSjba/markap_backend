# Plan de desarrollo — Sistema Contable (`contabilidad`)

> **Objetivo:** Construir el módulo contable-financiero de MARKAP como **procesos de negocio** (no tablas sueltas), cumpliendo la normativa contable y tributaria peruana aplicable a empresas del grupo, con salida a **libros electrónicos (PLE)** y estados financieros.
>
> **Última actualización:** 2026-06-29  
> **App slug:** `contabilidad` · **Base path:** `/contabilidad`  
> **Estado general:** Fase 7 (ventas contables) completada — Fase 8 pendiente

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
Integración con apps MARKAP (alquileres, ventas, producción, interiorismo…)
```

---

## Menú actual (sidebar)

| Sección | Rutas base | Estado UI |
|---------|------------|-----------|
| Dashboard | `/contabilidad` | Shell (KPIs placeholder) |
| Contabilidad | plan-cuentas, asientos, periodos, centros-costo, cierre | **Placeholder** |
| Tesorería | caja, bancos, conciliaciones, movimientos, transferencias | **Placeholder** |
| Compras | facturas, NC, proveedores, pagos | **Implementado** |
| Ventas | facturas, boletas, NC, clientes, cobros | **Placeholder** |
| Tributos | IGV, detracciones, retenciones, percepciones | **Placeholder** |
| Libros electrónicos | registro compras/ventas, diario, mayor, caja, bancos, PLE | **Placeholder** |
| Reportes financieros | balance, ER, flujos, KPIs | **Placeholder** |
| Configuración | `/contabilidad/configuracion` | **Placeholder** |

Seed menú: `prisma/seed/data/menus-contabilidad.ts`  
Rutas frontend: `markap_frontend/src/modules/contabilidad/presentation/router/`

---

## Decisiones de diseño (cerrar antes de codear)

- [ ] **Multi-empresa / multi-RUC:** ¿Un `applicationSlug=contabilidad` por holding o una empresa contable por `companyId`? (Recomendado: entidad `AccountingCompany` con RUC propio dentro de la app.)
- [x] **Estados del asiento:** `DRAFT` → `POSTED` → `REVERSED`; periodo cerrado bloquea edición/publicación.
- [x] **Partida doble estricta:** publicar solo si debe = haber.
- [ ] **Plan de cuentas jerárquico:** código PCGE (ej. `1011`, `40111`); cuentas de movimiento vs título; no borrar cuentas con movimiento.
- [ ] **Moneda:** PEN en v1; diseño preparado para multimoneda (tipo de cambio) en fase posterior.
- [ ] **CPE / facturación electrónica:** v1 registro contable manual + import; integración OSE/PSE en fase futura explícita.
- [ ] **PLE:** generación de archivos según estructura SUNAT; no reemplaza el envío por SOL (export + validación local).
- [ ] **Integración MARKAP:** eventos de dominio (`RentalPaymentPosted`, `SaleInvoiceIssued`, etc.) → plantillas de asiento configurables.
- [ ] **Auditoría:** `createdBy`, `postedBy`, `postedAt`; trazabilidad de cambios en asientos publicados = solo reversa.

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
| 8 | Tributos (IGV, detracciones, retenciones) | ⬜ Pendiente |
| 9 | Libros electrónicos y PLE | ⬜ Pendiente |
| 10 | Cierre mensual y EEFF | ⬜ Pendiente |
| 11 | Reportes y dashboard | ⬜ Pendiente |
| 12 | Integración con apps MARKAP | ⬜ Pendiente |

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
- [ ] Plantillas de asiento recurrentes (opcional v1.1)

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
- [x] Pagos vinculados
- [x] Vista proveedores (saldo CxP)

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
- [x] Cobros
- [x] Clientes con saldo CxC (1041)

---

## Fase 8 — Tributos

> Gestión del crédito/débito fiscal y obligaciones accesorias.

### Backend

- [ ] **IGV:** resumen mensual crédito vs débito; saldo a favor / a pagar (cuenta 40.11)
- [ ] **Detracciones:** registro SPOT, cuenta 40.12, constancia, tasa por bien/servicio (tabla configurable SUNAT)
- [ ] **Retenciones:** agente retención IGV / renta (según perfil)
- [ ] **Percepciones:** registro y aplicación
- [ ] Preparación datos **PDT 621** (export estructurado; sin envío SOL en v1)
- [ ] API `/contabilidad-taxes`

### Frontend (`features/tributos`)

- [ ] Dashboard tributario del periodo
- [ ] Pantallas IGV, detracciones, retenciones, percepciones
- [ ] Export para declaración (CSV/Excel)

---

## Fase 9 — Libros electrónicos y PLE

> Generación de archivos según estructura SUNAT (validación local).

### Backend

- [ ] Servicio generación PLE por periodo:
  - [ ] 5.1 / 5.2 Libro Diario y Plan de Cuentas
  - [ ] 6.1 Mayor
  - [ ] 8.1 Registro de Compras
  - [ ] 8.2 Registro de Compras (no domiciliados) — si aplica
  - [ ] 14.1 Registro de Ventas
  - [ ] 1.1 Caja y Bancos (libro caja / bancos según diseño)
- [ ] Validador: cuadre, campos obligatorios, formato pipe/columnas
- [ ] API `GET /contabilidad-ple/:period/:bookCode`

### Frontend (`features/libros-e`)

- [ ] Selector periodo + libros a generar
- [ ] Descarga ZIP PLE
- [ ] Log de errores de validación pre-export
- [ ] Vistas consulta: libro diario, mayor, registros (read-only desde datos contables)

---

## Fase 10 — Cierre mensual y estados financieros

### Backend

- [ ] Proceso cierre: bloquea asientos en periodo; asientos de regularización (opcional wizard)
- [ ] Cálculo saldos por cuenta → **Balance General** (activo = pasivo + patrimonio)
- [ ] **Estado de resultados** por naturaleza de cuenta (70, 69, 91…)
- [ ] **Estado de flujo de efectivo** (método indirecto v1)
- [ ] API `/contabilidad-closing`, `/contabilidad-financial-statements`

### Frontend

- [ ] Wizard cierre mensual (checklist: tributos cuadrados, conciliación bancaria, etc.)
- [ ] Pantalla cierre con resumen
- [ ] Reportes BG y ER con comparativo periodo anterior

---

## Fase 11 — Reportes financieros y dashboard

### Backend

- [ ] `GET /contabilidad-reports/dashboard` — KPIs: liquidez, CxC, CxP, IGV periodo, resultado
- [ ] Libro mayor analítico, balance de comprobación
- [ ] Export Excel/PDF reportes

### Frontend

- [ ] Reemplazar `ContabilidadHomeView` con KPIs reales
- [ ] Reportes: balance, ER, flujo caja, flujo efectivo, análisis, KPIs
- [ ] Filtros periodo / centro de costo

---

## Fase 12 — Integración con apps MARKAP

> La contabilidad recibe hechos económicos de otros módulos; no duplica operación comercial.

| App origen | Evento ejemplo | Asiento sugerido |
|------------|----------------|------------------|
| `alquileres` | Cobro de alquiler | Dr 10 / Cr 70 (+ IGV) |
| `ventas` (inmob.) | Separación / cierre venta | CxC, ingreso diferido, comisiones |
| `produccion` | Factura cotización aceptada / entrega | CxC, ingreso, costo de ventas |
| `interiorismo` | Cobro proyecto / pago proveedor | CxC / CxP, ingreso por etapas |
| `produccion` compras | OC recibida / pago proveedor | Compras + IGV crédito |

### Backend

- [ ] `AccountingIntegrationEvent` + plantillas configurables (cuenta por concepto)
- [ ] Cola o hook post-operación en cada app (feature flag)
- [ ] Idempotencia (no duplicar asiento por mismo `sourceId`)

### Frontend

- [ ] Configuración → Integraciones: mapeo cuentas por app/evento
- [ ] Log de asientos generados automáticamente

---

## Orden recomendado de implementación

```text
0 Infra menú
  → 1 Configuración
  → 2 Plan de cuentas (PCGE)
  → 3 Periodos + centros de costo
  → 4 Asientos / libro diario
  → 5 Tesorería
  → 6 Compras contables
  → 7 Ventas contables
  → 8 Tributos
  → 9 Libros electrónicos + PLE
  → 10 Cierre + EEFF
  → 11 Reportes + dashboard
  → 12 Integración MARKAP
```

---

## Modelo de datos (borrador Prisma)

```text
AccountingCompanySettings
AccountingAccount          (árbol PCGE)
AccountingPeriod
CostCenter
JournalEntry + JournalEntryLine
CashBox, BankAccount, TreasuryMovement, BankReconciliation
PurchaseInvoice, PurchaseCreditNote, PurchasePayment
SalesInvoice, SalesReceipt, SalesCreditNote, SalesCollection
TaxDetraction, TaxRetention, TaxPerception, IgvPeriodSummary
PleExportLog
AccountingIntegrationTemplate
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

## Riesgos y fuera de alcance v1

- **Facturación electrónica SUNAT (OSE/PSE)** y envío en línea de CPE → fase posterior explícita.
- **Declaraciones SOL automáticas** (PDT 621, PLAME) → solo export de datos en v1.
- **NIIF completas** para consolidación de grupos → evaluar según cliente.
- **Inventarios permanentes valorizados** (cuenta 20/21 integrada con stock producción) → integración Fase 12+.
- **Tipo de cambio** operaciones en USD → multimoneda fase futura.

---

## Notas técnicas

- Backend: clean architecture (domain → use cases → infrastructure → HTTP).
- Frontend: arquitectura modular por feature (`features/<nombre>/`).
- Montos: `Decimal` en Prisma; nunca `float` para importes tributarios.
- Zona horaria reportes: `America/Lima`.
- Cada fase nueva: actualizar este `.md` marcando checkboxes y la tabla **Resumen de avance**.
