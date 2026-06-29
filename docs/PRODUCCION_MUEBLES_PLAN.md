# Plan de desarrollo — Producción de Muebles (`produccion`)

> **Objetivo:** Construir el módulo de fabricación de muebles como **procesos de trabajo** (no tablas sueltas), alineado al flujo real del negocio y al menú ya definido en MARKAP.
>
> **Última actualización:** 2026-06-29  
> **App slug:** `produccion` · **Base path:** `/produccion`

---

## Cómo usar este documento

- Marca `[x]` cada ítem al completarlo.
- Cada fase termina con **build OK** (`npm run build` backend + frontend) salvo que diga lo contrario.
- Las fases siguen **dependencias de negocio**, no solo el orden visual del menú.

---

## Flujo operativo (referencia)

```text
Clientes
    ↓
Catálogo de muebles (diseño / ficha del producto)
    ↓
Costeo (materiales + mano de obra + gastos)
    ↓
Compras → Inventario (materiales entran a almacén)
    ↓
Orden de producción → Producción en planta → Producto terminado
    ↓
Ventas: Cotización → Pedido → Entrega
    ↓
Reportes · Configuración
```

---

## Menú actual (sidebar)

| Sección | Rutas | Estado UI |
|---------|-------|-----------|
| Dashboard | `/produccion` | Shell con KPIs estáticos |
| Clientes | `/produccion/clientes`, `/nuevo`, `/:id`, `/:id/editar` | **Funcional** |
| Catálogo de muebles | `/produccion/catalogo`, `/nuevo` | Placeholder |
| Producción | OT, en proceso, etapas, terminados | **Funcional** |
| Inventario | materiales, stock, movimientos | **Funcional** |
| Compras | proveedores, órdenes de compra | **Funcional** |
| Ventas | cotizaciones, pedidos, entregas | **Funcional** |
| Costos | costeo, mano de obra, gastos | **Funcional** |
| Reportes | `/produccion/reportes` | **Funcional** |
| Configuración | `/produccion/configuracion` | Placeholder |

---

## Decisiones de diseño (cerrar antes de codear)

- [x] Menú por **procesos**, no por tablas de BD
- [x] **Clientes** en primer nivel (como Interiorismo), tipos Residencial / Corporativo
- [x] API de clientes compartida (`/clients` + `applicationSlug=produccion`)
- [ ] **Un mueble del catálogo** = producto terminable con ficha técnica, medidas, categoría, imágenes y BOM base (lista de materiales)
- [ ] **Costeo** se calcula desde catálogo + BOM + tarifas (no guardar totales redundantes en BD)
- [ ] **Inventario** de materiales separado del catálogo de muebles (insumos vs producto terminado) — **v1 listo**
- [ ] **Cotización** referencia cliente + uno o más ítems del catálogo (o líneas ad hoc)
- [ ] **OT** vincula pedido / cotización aceptada → etapas de taller

---

## Resumen de avance

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Infraestructura y menú | ✅ Hecho |
| 1 | Clientes | ✅ Hecho |
| 2 | Catálogo de muebles | ✅ Hecho |
| 3 | Costos | ✅ Hecho |
| 4 | Inventario | ⬜ Pendiente |
| 5 | Compras | ⬜ Pendiente |
| 6 | Producción (taller) | ⬜ Pendiente |
| 7 | Ventas | ⬜ Pendiente |
| 8 | Reportes | ⬜ Pendiente |
| 9 | Configuración | ⬜ Pendiente |
| 10 | Dashboard integrado | ⬜ Pendiente |

---

## Fase 0 — Infraestructura y menú

- [x] Aplicación `produccion` en seed (`applications.ts`)
- [x] Menú reorganizado por flujo de negocio (`menus-produccion.ts` + seed)
- [x] `fallbackMenus.ts` y rutas Vue alineadas
- [x] `ProduccionLayout`, dashboard shell, placeholders
- [x] Redirecciones rutas antiguas (`/productos`, `/ventas/clientes`, etc.)
- [x] Roles con acceso a la app (seed)

---

## Fase 1 — Clientes

### Backend

- [x] `applicationSlug=produccion` en listado / stats / create (`RESIDENTIAL` | `CORPORATE`)
- [ ] Seed demo: 2–3 clientes de muebles (opcional)

### Frontend (`features/clientes`)

- [x] Domain + API repository + `useProduccionClients`
- [x] Listado (`DataTable`, filtros, stats, Excel, paginación)
- [x] Nuevo cliente / Editar / Detalle / Eliminar
- [x] Router conectado (sin placeholder)
- [x] Acceso rápido en dashboard

### Integración futura

- [ ] Enlace desde ficha cliente → cotizaciones (cuando exista Fase 7)
- [ ] Enlace desde ficha cliente → pedidos (cuando exista Fase 7)

---

## Fase 2 — Catálogo de muebles

> Base del negocio: todo lo demás (costeo, cotización, OT) referencia un mueble del catálogo.

### Backend

- [x] Modelo Prisma `ProduccionFurniture` (o nombre acordado): `applicationId`, `code`, `name`, `category`, `description`, dimensiones, `referencePrice`, `isActive`, imágenes
- [x] Modelo opcional `ProduccionFurnitureBomLine` (material, cantidad, unidad) — v1 simple
- [x] `prisma db push` / migración
- [x] Repository + use cases (list, get, create, update, delete, stats)
- [x] Controller REST `/produccion-furniture`
- [x] DTOs validados
- [x] Seed demo: 3–5 muebles ejemplo

### Frontend (`features/catalogo`)

- [x] Estructura modular (domain / application / infrastructure / presentation)
- [x] Listado: grilla, búsqueda, filtro categoría/estado, stats
- [x] Listado: export Excel
- [x] Nuevo mueble: formulario por secciones (identificación, medidas, precio ref., notas)
- [x] Editar mueble
- [x] Detalle: ficha + pestaña BOM (materiales base) + placeholder cotizaciones
- [x] Router: reemplazar placeholders en `/produccion/catalogo`
- [x] Acceso rápido dashboard → Nuevo mueble (ya enlazado; validar con vista real)

---

## Fase 3 — Costos

> Después del catálogo: saber cuánto cuesta fabricar cada mueble.

### Backend

- [x] Modelo / servicio de **costeo** por mueble (BOM × precio material + MO + gastos)
- [x] Endpoints: calcular costeo, guardar snapshot de costeo (opcional para historial)
- [x] Tarifas de mano de obra (tabla o config)
- [x] Gastos adicionales por mueble o por lote

### Frontend (`features/costos`)

- [x] **Costeo de muebles**: selector de mueble del catálogo → desglose H/MO/gastos
- [x] **Mano de obra**: tarifas por etapa o por hora
- [x] **Gastos adicionales**: listado y registro
- [x] Enlace desde detalle de mueble → “Ver costeo”

---

## Fase 4 — Inventario

> Materiales e insumos en almacén (antes y durante la producción).

### Backend

- [x] Modelo `ProduccionMaterial` (catálogo de insumos: madera, herrajes, barniz…)
- [x] Modelo `ProduccionStockMovement` (kardex con `currentStock` en material)
- [x] API: `/produccion-materials` CRUD + stats; `/produccion-stock-movements` list + create (ingreso, salida, ajuste)
- [x] Seed demo: `prisma/seed/steps/demo-produccion-inventory.ts`

### Frontend (`features/inventario`)

- [x] Materiales: listado + alta/edición
- [x] Stock: vista por material, alertas bajo mínimo
- [x] Movimientos: kardex con filtros
- [ ] Integración: salida de stock al consumir en OT (Fase 6)

---

## Fase 5 — Compras

> Abastecimiento hacia almacén.

### Backend

- [x] Modelo `ProduccionSupplier` (proveedores)
- [x] Modelo `ProduccionPurchaseOrder` + líneas
- [x] Estados: borrador → enviada → recibida parcial/total
- [x] Al recibir OC → movimiento de inventario (Fase 4)
- [x] API: `/produccion-suppliers`, `/produccion-purchase-orders` (+ send/receive/cancel)
- [x] Seed demo: `demo-produccion-purchases.ts`

### Frontend (`features/compras`)

- [x] Proveedores: CRUD + detalle con vínculos a materiales
- [x] Órdenes de compra: listado, nueva, detalle, recepción
- [x] Enlace proveedor ↔ materiales que suministra

---

## Fase 6 — Producción (taller)

> Del pedido a la pieza terminada.

### Backend

- [x] Modelo `ProduccionWorkOrder` (OT): cliente, mueble(s), fechas, estado, prioridad
- [x] Etapas: planificación, corte, ensamble, acabados (v1 fijas)
- [x] Seguimiento en proceso (% avance, responsable por etapa)
- [x] Productos terminados: OT `COMPLETED`
- [x] API `/produccion-work-orders` (+ start, stages, complete, consume-materials)
- [x] Seed demo: `demo-produccion-work-orders.ts`

### Frontend (`features/taller`)

- [x] **Órdenes de trabajo**: listado, nueva OT, detalle
- [x] **Producción en proceso**: lista filtrada
- [x] **Etapas de producción**: vista por etapa (`?etapa=`)
- [x] **Productos terminados**: OT completadas
- [x] Integración inventario: consumo materiales (salida kardex)
- [ ] Costos reales vs estimados (refinar en reportes)

---

## Fase 7 — Ventas

> Comercial: de la cotización a la entrega.

### Backend

- [x] `ProduccionQuotation` + líneas (cliente, muebles del catálogo, precios, vigencia)
- [x] `ProduccionOrder` (pedido) desde cotización aceptada
- [x] `ProduccionDelivery` (entregas / guías)
- [x] Estados cotización: borrador → enviada → aceptada / rechazada
- [x] Pedido aceptado → puede generar OT (Fase 6) — `POST /produccion-orders/:id/create-work-order`

### Frontend (`features/ventas`)

- [x] **Cotizaciones**: listado, nueva, detalle, envío y aceptación
- [x] **Pedidos**: listado, detalle, confirmación, conversión desde cotización, generar OT
- [x] **Entregas**: programación y confirmación
- [x] Enlaces desde ficha de cliente (pestañas con filtro `clientId`)
- [ ] PDF cotización (futuro)

---

## Fase 8 — Reportes

### Backend

- [x] Endpoints agregados: producción por período, ventas, inventario valorizado, rentabilidad por mueble (`GET /produccion-reports/dashboard`)

### Frontend

- [x] Pantalla reportes con filtros (fecha, categoría, cliente)
- [x] Export Excel según reporte
- [ ] Gráficos básicos (opcional / futuro)

---

## Fase 9 — Configuración

- [x] Categorías de muebles
- [x] Etapas de producción (nombres, orden)
- [x] Unidades de medida
- [x] Parámetros por defecto (IGV costeo, % desperdicio madera, etc.)
- [x] Numeración automática (código mueble, OT, cotización, OC, pedido, entrega)

---

## Fase 10 — Dashboard integrado

- [ ] KPIs reales desde API (OT activas, en planta, stock alerta, OC pendientes, cotizaciones abiertas)
- [ ] Actividad reciente (últimas OT, entregas, movimientos)
- [ ] Accesos rápidos alineados al flujo (ya parcialmente hecho)

---

## Orden recomendado de implementación

```text
0 Infra menú  →  1 Clientes  →  2 Catálogo  →  3 Costos
       →  4 Inventario  →  5 Compras  →  6 Producción
       →  7 Ventas  →  8 Reportes  →  9 Config  →  10 Dashboard
```

**Siguiente paso:** Fase 10 — Dashboard integrado.

---

## Referencias en el repo

| Área | Ubicación |
|------|-----------|
| Menú seed | `prisma/seed/data/menus-produccion.ts` |
| Rutas frontend | `markap_frontend/src/modules/produccion/presentation/router/` |
| Clientes (plantilla) | `markap_frontend/src/modules/produccion/features/clientes/` |
| Catálogo materiales (referencia UI) | `markap_frontend/.../interiorismo/features/materiales-catalogo/` |
| Plan similar | `docs/INTERIORISMO_PRESUPUESTOS_PLAN.md` |

---

## Notas

- Reutilizar componentes de `@shared/components` (`DataTable`, `FormInput`, `StatsCard`, etc.).
- Backend: clean architecture (domain → use cases → infrastructure → HTTP).
- Frontend: arquitectura modular por feature (`features/<nombre>/`).
- Cada fase nueva: actualizar este `.md` marcando checkboxes y la tabla **Resumen de avance**.
