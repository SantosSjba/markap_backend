# Arquitectura del Backend — Clean Architecture

Este documento describe la arquitectura del proyecto backend MARKAP, basada en **Clean Architecture** (Uncle Bob) y implementada con **NestJS** y **Prisma**.

## Principios

- **Independencia de frameworks**: La lógica de negocio no depende de NestJS, Prisma ni de la base de datos.
- **Testabilidad**: Los use cases dependen solo de interfaces (puertos); las implementaciones se pueden sustituir por mocks.
- **Regla de dependencias**: Las dependencias solo apuntan hacia el interior. **Domain** y **Application** no conocen **Infrastructure**.
- **Puertos y adaptadores**: La aplicación define puertos (interfaces de repositorios, servicios); la infraestructura implementa los adaptadores.

## Capas

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  Infrastructure  →  HTTP (controllers, DTOs), DB (Prisma), Mail  │
  ├─────────────────────────────────────────────────────────────────┤
  │  Application     →  Use cases, repositorios (puertos), servicios │
  ├─────────────────────────────────────────────────────────────────┤
  │  Domain          →  Entidades (User, Role, Application, etc.)   │
  └─────────────────────────────────────────────────────────────────┘
```

### 1. Domain (`src/application/entities/`)

- **Entidades**: Objetos de negocio con identidad (User, Role, Application).
- Sin dependencias de otras capas.
- Representan el modelo del dominio, no el esquema de la base de datos.

### 2. Application (`src/application/`)

- **Repositories (puertos)**: Interfaces que definen cómo se persiste y se lee la información. Ej.: `UserRepository`, `RentalRepository`, `RoleRepository`. Se exportan con un símbolo para inyección en NestJS (ej. `RENTAL_REPOSITORY`).
- **Use cases**: Casos de uso que orquestan la lógica. Cada use case:
  - Recibe entrada (DTO o parámetros).
  - Depende solo de puertos (inyección de repositorios y servicios abstractos).
  - No importa nada de `infrastructure` ni de `prisma`.
- **Services (puertos)**: Interfaces para servicios externos (HashService, TokenService, MailService). Las implementaciones viven en Infrastructure.
- **Exceptions**: Excepciones de dominio/aplicación (ej. `EntityNotFoundException`).

### 3. Infrastructure (`src/infrastructure/`)

- **database/**: Prisma, implementaciones de repositorios (ej. `UserPrismaRepository`, `RentalPrismaRepository`), mappers Prisma ↔ dominio.
- **http/**: Controllers, DTOs (validación con class-validator), guards, filters, gateways WebSocket.
- **services/**: Implementaciones concretas (BcryptHashService, JwtTokenService, NodemailerMailService).

Los controladores inyectan **use cases**; el **DatabaseModule** registra las implementaciones de los repositorios (adaptadores) para los puertos que los use cases esperan.

### 4. Config y Common

- **config/**: Variables de entorno y configuración.
- **common/**: Guards (JWT, WebSocket), filters (AllExceptionsFilter), tipos compartidos.

## Regla de dependencias

- **Application** no puede importar de **Infrastructure** ni de **Prisma**.
- **Infrastructure** importa de **Application** (interfaces, entidades, use cases) y de **Domain** vía Application.
- **Domain** no importa de nadie.

Si un use case necesita algo que hoy está en Prisma, se debe:
1. Definir un método en el **repositorio (puerto)** de la capa application.
2. Implementar ese método en el **repositorio Prisma** en infrastructure.

## Estructura de carpetas

```
src/
  application/
    entities/           # Entidades de dominio
    repositories/       # Interfaces (puertos) de repositorios
    use-cases/          # Casos de uso por contexto (auth, users, roles, rentals, ...)
    services/           # Interfaces de servicios (Hash, Token, Mail)
    exceptions/
  infrastructure/
    database/
      prisma/           # PrismaService, repositorios Prisma, mappers
    http/
      controllers/
      dtos/
      services/         # Implementaciones (bcrypt, jwt, nodemailer)
      gateways/
  config/
  common/
  app.module.ts
  main.ts
```

## Cómo extender el proyecto

Para agregar nuevas funcionalidades, nuevos recursos o nuevos casos de uso, sigue la guía **[Cómo agregar nuevas funcionalidades](./ADDING_FEATURES.md)**.
