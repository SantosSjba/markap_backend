# Arquitectura del backend

## Decisión

Monolito modular con NestJS, capas por área de negocio y puertos/adaptadores para efectos externos. Un módulo representa una capacidad del producto; las capas ordenan sus responsabilidades. No se incorporan microservicios, CQRS ni un bus de eventos sin una necesidad concreta.

La regla central de Clean Architecture es la dirección de las dependencias. La estructura de carpetas ayuda a expresarla; `pnpm check:architecture` la comprueba. NestJS permite encapsular proveedores con módulos, imports y exports; mover archivos por sí solo no ofrece esa encapsulación.

## Estructura

```text
src/
  app.module.ts                  # configuración y composición raíz
  main.ts                        # bootstrap, HTTP, Swagger, validación global
  config/                        # configuración y validación del entorno
  composition/
    api.module.ts                # reúne las capacidades del producto
    runtime.module.ts            # adaptadores compartidos y seguridad
  modules/
    identity/                    # autenticación, usuarios, roles, aplicaciones, menús
    crm/                         # clientes y agentes
    properties/                  # inmuebles
    rentals/                     # contratos, pagos e informes de alquileres
    notifications/               # alertas, WebSocket y programación
    ventas/
    interiorismo/
    arquitectura/
    produccion/
    contabilidad/
      <area>.module.ts           # registro de controladores, casos de uso y adaptadores
      domain/
        entities/                # entidades y tipos de negocio
        repositories/            # contratos de persistencia existentes
        constants/
        utils/                   # reglas y cálculos puros
      application/
        use-cases/               # operaciones del producto
        services/                # coordinación de operaciones relacionadas
        ports/                   # contratos de entrada y capacidades externas
        facades/                 # implementación de puertos de entrada
        validators/
        mappers/                 # proyecciones de salida independientes del transporte
      presentation/
        controllers/
        dtos/                    # validación y documentación de entradas HTTP
        gateways/
        mappers/
      infrastructure/
        persistence/
          <area>-persistence.module.ts
          repositories/
          mappers/
        exports/                 # generación de archivos cuando corresponde
        scheduling/
  shared/
    domain/                      # excepciones, objetos de valor, fechas y cálculos comunes
    application/                 # puertos, DTOs y validaciones reutilizables
    infrastructure/              # Prisma, S3, correo, hash, JWT, hojas de cálculo
    presentation/                # guards, filtros, pipes, interceptores y endpoints técnicos
    utils/                       # utilidades comunes sin estado
    types/
    constants/
```

Solo se crean directorios que contienen código. Las áreas conservan los nombres del negocio y los conceptos existentes de la API. `prisma/` conserva modelos, migraciones y seeds; `test/` contiene pruebas HTTP y el contrato previo a la reorganización.

## Dependencias permitidas

- Dominio: código puro, biblioteca estándar y otros contratos de dominio. Sin NestJS, ORM, transporte ni proveedores externos.
- Aplicación: dominio y contratos de aplicación. En esta implementación se conserva NestJS para inyección y excepciones; por tanto, la aplicación no es independiente del framework. No puede importar infraestructura, presentación ni librerías de adaptadores.
- Presentación: aplicación y dominio para interpretar entradas y publicar resultados.
- Infraestructura: implementa contratos internos y conoce librerías externas.
- Composición: conoce las capas necesarias para registrar implementaciones concretas. Aquí se decide `provide`, `useClass` y `useExisting`.

Los contratos de repositorio se mantienen junto al dominio para conservar una única definición por recurso. No es necesario duplicarlos en aplicación. Los DTOs HTTP con decoradores de validación permanecen en presentación; las entradas y salidas de los casos de uso son tipos internos.

## Patrones utilizados

| Patrón                                       | Aplicación concreta                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module / monolito modular                    | Diez capacidades registradas en `ApiModule`; proveedores internos encapsulados.                                                                                     |
| Repository                                   | Contratos internos e implementaciones Prisma por área.                                                                                                              |
| Dependency Inversion / puertos y adaptadores | La aplicación pide archivos, lectura de presupuestos, consultas de referencia, exportación financiera y notificaciones mediante contratos.                          |
| Use Case                                     | Coordina una operación; el controlador delega en el caso de uso o su fachada.                                                                                       |
| Facade                                       | Fachadas de autenticación, clientes, agentes, inmuebles, alquileres y pagos implementan los puertos de entrada existentes.                                          |
| Mapper                                       | Convierte datos de persistencia, resultados internos o respuestas sin mezclar sus responsabilidades.                                                                |
| Value Object                                 | Email, teléfono y dinero compartidos.                                                                                                                               |
| Unit of Work                                 | `PrismaService.atomic()` conserva la transacción compartida por repositorios. `PeriodTransactionPort` solicita el bloqueo de cierre contable sin SQL en aplicación. |
| Adapter                                      | S3/MinIO, WebSocket, correo, hash, JWT, Excel y exportación PDF/Excel.                                                                                              |

`NotificationDeliveryPort` usa `useExisting` para publicar con la misma instancia de `NotificationsGateway`. Evita crear una segunda instancia sin el servidor WebSocket inicializado.

## Reutilización y estandarización

- `BusinessReferencePort`: consultas de pertenencia y catálogos para evitar acceso directo a Prisma desde validaciones y casos de uso. Devuelve resultados pequeños; no acepta consultas Prisma.
- `assertAgentsBelongToApplication`: deduplica IDs y comprueba el ámbito del responsable en proyectos de ambas áreas.
- `BudgetSpreadsheetPort`: un solo lector Excel para arquitectura e interiorismo.
- Cálculos de presupuesto y liquidación: una implementación en `shared/domain/budgets`.
- Adjuntos de presupuesto: DTO y mapper comunes.
- `FileStoragePort`: capacidad de archivos común, implementada por el servicio de archivos existente.
- `PersistenceErrorPort` y `mapOperationError`: política común para conservar errores HTTP o de persistencia y aplicar su traducción global.
- `amountToNumber`: normalización numérica común sin importar Prisma desde los mapeadores de aplicación.
- Imports directos, sin barrels de módulos o proveedores. Los símbolos de inyección se importan desde su contrato original.

La reutilización se aplica a reglas equivalentes. Los repositorios de arquitectura e interiorismo permanecen separados porque sus modelos y evolución pueden divergir. No se fuerza un repositorio genérico con nombres de tablas o consultas del ORM en el contrato.

## Composición de persistencia

`PrismaModule` es dueño de una única instancia de `PrismaService`. Cada módulo de persistencia registra los tokens de su área. `DatabaseModule` reúne y reexporta esos módulos como catálogo de infraestructura compartida: los flujos actuales consultan varias áreas. Los módulos de negocio no necesitan importar sus pares para acceder a los repositorios.

`StorageModule` importa solamente `PrismaModule` y exporta explícitamente sus capacidades; no es global. Los repositorios que usan archivos lo importan. Así se evita un ciclo entre almacenamiento y el catálogo completo de persistencia.

Las dependencias entre capacidades de aplicación son explícitas: ventas y alquileres importan notificaciones cuando las usan. Los demás servicios internos no se exportan de sus módulos.

Los controladores no importan Prisma ni adaptadores concretos de almacenamiento. Los catálogos de ubicación compartidos se consultan mediante `CatalogQueriesService`. La subida de medios de inmuebles y la persistencia de adjuntos/notas de alquileres se coordinan en aplicación; el reemplazo de adjuntos mantiene el bloqueo y la transacción originales.

## Verificación

```bash
pnpm check:architecture     # dirección de dependencias, imports resueltos, ciclos de ejecución
pnpm typecheck             # también revisa test y scripts TypeScript de Prisma
pnpm lint:check            # analiza todo src y test sin modificar archivos
pnpm build                 # compila desde cero el directorio dist
pnpm test:unit              # reglas, adaptadores, contrato HTTP y composición de Nest
pnpm test:e2e              # endpoints HTTP de health
pnpm verify                # todas las comprobaciones anteriores
```

La prueba de composición sustituye infraestructura externa: verifica el grafo de inyección y la inicialización de Nest sin consultar la base de datos ni conectarse a MinIO. El contrato HTTP conserva los decoradores de controladores y métodos, incluidos guards, rutas y documentación. No reemplaza pruebas de integración de negocio contra PostgreSQL, MinIO o SMTP.

No se ejecutan migraciones, seeds ni operaciones contra datos reales como parte de esta reorganización. La validación completa de integraciones requiere un entorno de pruebas con esos servicios.

## Fuentes y criterio

- [NestJS: Modules](https://docs.nestjs.com/modules): encapsulación, imports y exports.
- [NestJS: Custom providers](https://docs.nestjs.com/fundamentals/custom-providers): tokens y asociación de implementaciones.
- [NestJS: Circular dependency](https://docs.nestjs.com/fundamentals/circular-dependency): evitar ciclos y barrels de módulos/proveedores.
- [Robert C. Martin: The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html): regla de dependencias y fronteras.
- [Martin Fowler: Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html): separación de responsabilidades y criterio práctico.

No existe una única estructura de carpetas impuesta por estas fuentes. Esta estructura aplica sus principios al tamaño y a los flujos reales de Markap.

## Validación con Zod

Las entradas HTTP se validan con Zod 4 y un único `ZodValidationPipe` global. Los 210 DTOs migrados exponen `static readonly schema` y `static readonly isZodDto = true`, que reconoce `nestjs-zod`. Sus propiedades TypeScript y decoradores de Swagger se conservan para mantener los contratos y su documentación existentes. La validación reside exclusivamente en el esquema; no se usan decoradores de class-validator ni transformaciones de class-transformer.

Los objetos de entrada usan `z.strictObject`: los campos desconocidos producen HTTP 400. Los errores se traducen a mensajes españoles, conservan los mensajes personalizados e identifican filas de listas anidadas. `null`, omisión y cadenas vacías se tratan explícitamente según el contrato de cada campo.

`shared/presentation/validation/input-schemas.ts` reúne la conversión de primitivas de formulario, booleanos, importes y fechas. Las cadenas `"false"` y `"0"` producen `false`, sin usar `Boolean(texto)`. Los importes contables admiten números o texto con punto/coma decimal y conservan su valor para que las reglas de negocio hagan el cálculo posterior. Las reglas condicionales y la pertenencia a una aplicación permanecen separadas: Zod comprueba forma y reglas locales; los casos de uso consultan los puertos para reglas de negocio.

El entorno también se valida con Zod a través de `ConfigModule.forRoot({ validate: validateEnvironment })`. Los errores de configuración indican nombres de variables y reglas, sin imprimir sus valores. Se retiraron Joi, class-validator y class-transformer como dependencias directas del proyecto. Las comprobaciones de arquitectura impiden reintroducir importaciones de estas bibliotecas.

La generación de OpenAPI usa `cleanupOpenApiDoc`; las pruebas de composición comprueban que el documento completo y los esquemas de autenticación se generen correctamente.

## Logging

El backend usa Pino con contexto de solicitud y configuración central en `shared/infrastructure/logging`. Consulta [logging y convenciones](LOGGING.md) para niveles, eventos, request IDs y redacción. El dominio y la aplicación permanecen independientes del proveedor de logs.

## Integraciones de autenticación y planificación

`TokenModule` implementa el puerto de tokens con `@nestjs/jwt`. `AuthRateLimitModule` aplica `@nestjs/throttler` a las tres operaciones públicas de autenticación y recuperación, sin un guard global para las otras rutas. Las alertas usan `@nestjs/schedule` y `SchedulerRegistry`, manteniendo la cadencia y el bloqueo de solapamientos. Consulta [configuración y límites](AUTH_AND_SCHEDULING.md).
