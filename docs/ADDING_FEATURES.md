# Cómo agregar nuevas funcionalidades (Backend)

Esta guía describe los pasos para extender el backend MARKAP siguiendo **Clean Architecture**. Consulta [ARCHITECTURE.md](./ARCHITECTURE.md) para el contexto de capas y dependencias.

---

## Resumen rápido

| Quiero agregar… | Dónde | Pasos clave |
|-----------------|--------|--------------|
| **Nueva entidad de dominio** | `application/entities/` | Crear clase, exportar en `entities/index.ts`. |
| **Nuevo recurso (CRUD)** | Repository (puerto) + Use cases + Prisma repo + Controller + DTOs | Ver sección 1. |
| **Nuevo caso de uso** en un recurso existente | `application/use-cases/<contexto>/` | Crear use case que inyecte repositorios; registrar en HttpModule; llamar desde controller. |
| **Nuevo endpoint** en un controller existente | Controller + (opcional) use case | Añadir método en controller; si hay lógica, crear use case. |
| **Nuevo servicio externo** (ej. SMS) | Application (interface) + Infrastructure (impl) | Puerto en application/services; implementación en infrastructure; registrar en HttpModule. |

---

## 1. Agregar un nuevo recurso (ej. “Productos”)

Supón que quieres un módulo completo para **Productos**: listar, crear, obtener por ID, actualizar.

### Paso 1.1 — Entidad (si aplica)

Si el recurso tiene modelo de dominio propio:

- Crear `src/application/entities/product.entity.ts`.
- Exportar en `src/application/entities/index.ts`.

Si reutilizas tipos solo para persistencia, puedes definir interfaces en el repositorio (como en `RentalData` en `rental.repository.ts`).

### Paso 1.2 — Puerto del repositorio

- Crear `src/application/repositories/product.repository.ts`:
  - Interfaces de datos (CreateProductData, ProductData, ListProductsFilters, etc.).
  - Interface `ProductRepository` con los métodos: create, findMany, findById, update, delete (según necesidad).
  - Exportar símbolo: `export const PRODUCT_REPOSITORY = Symbol('ProductRepository');`

Regla: el use case **solo** conoce esta interfaz, no Prisma.

### Paso 1.3 — Use cases

- Crear carpeta `src/application/use-cases/products/`.
- Crear un use case por acción, por ejemplo:
  - `create-product.use-case.ts` — inyecta `PRODUCT_REPOSITORY`, implementa `execute(input)`.
  - `list-products.use-case.ts`
  - `get-product-by-id.use-case.ts`
  - `update-product.use-case.ts`
- Crear `index.ts` que exporte todos los use cases del contexto.

Cada use case debe **inyectar solo puertos** (repositorios/servicios definidos en application), sin importar `infrastructure` ni `prisma`.

### Paso 1.4 — Implementación del repositorio (Prisma)

- Crear `src/infrastructure/database/prisma/repositories/product-prisma.repository.ts`.
  - Implementar la interface `ProductRepository`.
  - Inyectar `PrismaService` y usar el cliente Prisma para las operaciones.
  - Si hay entidad de dominio, usar un mapper Prisma ↔ entidad (en `mappers/`).

### Paso 1.5 — Registrar el repositorio en DatabaseModule

- En `src/infrastructure/database/database.module.ts`:
  - Importar `ProductRepository`, `PRODUCT_REPOSITORY` y `ProductPrismaRepository`.
  - Añadir en `providers`: `{ provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository }`.
  - Añadir `PRODUCT_REPOSITORY` en `exports`.

### Paso 1.6 — DTOs HTTP

- Crear `src/infrastructure/http/dtos/products/`:
  - `create-product.dto.ts`, `update-product.dto.ts` (con class-validator).
  - `index.ts` que exporte los DTOs.

### Paso 1.7 — Controller

- Crear `src/infrastructure/http/controllers/products.controller.ts`:
  - Inyectar los use cases (CreateProductUseCase, ListProductsUseCase, etc.).
  - Definir rutas (GET, POST, PATCH, DELETE) y validación con DTOs.
  - Usar `JwtAuthGuard` y decoradores de Swagger según el resto del proyecto.

### Paso 1.8 — Registrar controller y use cases en HttpModule

- En `src/infrastructure/http/http.module.ts`:
  - Añadir `ProductsController` en `controllers`.
  - Añadir todos los use cases de productos en `providers`.

### Paso 1.9 — Prisma (esquema y migración)

- En `prisma/schema.prisma`: definir el modelo `Product` (o el que corresponda).
- Ejecutar `npx prisma migrate dev` para crear la migración.

---

## 2. Agregar un nuevo caso de uso a un recurso existente

Ejemplo: añadir “Archivar alquiler” (cambiar estado a ARCHIVED).

1. **Definir el contrato en el puerto**  
   En `src/application/repositories/rental.repository.ts` añadir, por ejemplo:  
   `archive(id: string): Promise<RentalData>;`

2. **Implementar en el adaptador**  
   En `src/infrastructure/database/prisma/repositories/rental-prisma.repository.ts` implementar `archive(id)` usando Prisma.

3. **Crear el use case**  
   Crear `src/application/use-cases/rentals/archive-rental.use-case.ts` que inyecte `RENTAL_REPOSITORY` y llame a `archive(id)`. Exportarlo en `rentals/index.ts`.

4. **Registrar y exponer**  
   Añadir el use case en `providers` de `HttpModule`. En `RentalsController` añadir un endpoint (ej. PATCH `/:id/archive`) que llame al use case.

---

## 3. Agregar un nuevo endpoint sin lógica compleja

Si es solo lectura o delegación a un repositorio existente:

1. En el controller correspondiente, añadir el método (Get, Post, Patch, Delete).
2. Si hace falta un método nuevo en el repositorio (por ejemplo, un filtro distinto), añadir el método en la **interface** del repositorio (application) y en la **implementación** Prisma (infrastructure).
3. Inyectar el repositorio en el controller **no** es recomendable en Clean Architecture: los controllers llaman a use cases. Crea un use case fino que delegue al repositorio si hace falta.

---

## 4. Agregar un nuevo servicio externo (ej. envío de SMS)

1. **Definir el puerto**  
   Crear `src/application/services/sms.service.ts` con una interfaz o clase abstracta, por ejemplo:  
   `send(to: string, message: string): Promise<void>;`

2. **Implementación**  
   Crear `src/infrastructure/http/services/twilio-sms.service.ts` (o el proveedor que uses) que implemente esa interfaz.

3. **Registro en HttpModule**  
   En `providers`: `{ provide: SmsService, useClass: TwilioSmsService }` y exportar si otro módulo lo necesita.

4. **Uso en use cases**  
   Inyectar `SmsService` en el use case que deba enviar SMS; el use case no conoce Twilio ni detalles de infraestructura.

---

## 5. Checklist al agregar funcionalidad

- [ ] **Application** no importa de **infrastructure** ni de **prisma**.
- [ ] Los use cases dependen solo de **puertos** (repositorios/servicios definidos en application).
- [ ] Nuevos métodos de persistencia: primero en la **interface** del repositorio, luego en la implementación Prisma.
- [ ] Controller solo llama a **use cases**, no a repositorios directamente.
- [ ] DTOs en infrastructure con **class-validator** para las entradas HTTP.
- [ ] Repositorio y use cases registrados en **DatabaseModule** y **HttpModule**.
- [ ] Si añades modelos nuevos: **Prisma schema** y **migración**.

Con esto el backend se mantiene alineado con Clean Architecture y escalable para nuevas funcionalidades.
