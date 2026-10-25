# Agregar funcionalidades

Consulta [la arquitectura](ARCHITECTURE.md) antes de introducir un módulo nuevo.

## Una operación de un área existente

1. Define entrada, salida y regla en `src/modules/<area>/application/use-cases/<recurso>/`. Los tipos de entrada internos no importan DTOs HTTP.
2. Usa un contrato existente o amplíalo en `domain/repositories/`. Para una capacidad externa nueva, define un puerto en `application/ports/`.
3. Implementa persistencia en `infrastructure/persistence/repositories/` o el adaptador externo en `infrastructure/`. Conserva aquí consultas, SQL y librerías del proveedor.
4. Registra el token del repositorio en `<area>-persistence.module.ts`. Registra el caso de uso y los adaptadores de aplicación en `<area>.module.ts`.
5. Declara validación y Swagger en `presentation/dtos/`; el controlador delega en el caso de uso o fachada existente.
6. Añade una prueba de la regla, especialmente para ámbito de aplicación, permisos, dinero o transacciones. Ejecuta `pnpm verify`.

## Una capacidad nueva

Crea `src/modules/<area>/<area>.module.ts` y únicamente las carpetas necesarias de dominio, aplicación, presentación e infraestructura. Impórtala desde `composition/api.module.ts`. Si utiliza Prisma, registra y exporta su módulo de persistencia desde `shared/infrastructure/database/database.module.ts`.

Exporta únicamente los proveedores usados por otra capacidad. No dupliques proveedores de un módulo importado. Para compartir la instancia de una implementación, utiliza `useExisting`; para construir un adaptador, `useClass` o una fábrica explícita.

## Convenciones

- Archivos y directorios en `kebab-case`; clases y tipos en `PascalCase`.
- Sufijos por responsabilidad: `.controller.ts`, `.dto.ts`, `.use-case.ts`, `.facade.ts`, `.repository.ts`, `.adapter.ts`, `.mapper.ts`, `.port.ts`, `.module.ts` y `.spec.ts`.
- No crear `index.ts` para módulos/proveedores. Importar directamente desde el archivo dueño del símbolo.
- Dominio sin NestJS ni adaptadores; aplicación sin Prisma, SQL, clientes de almacenamiento o transporte.
- Validaciones compartidas en `shared/application/validation`; cálculos puros comunes en `shared/domain`. Compartir solo cuando existe reutilización real.
- No propagar consultas Prisma, nombres de tablas o DTOs HTTP mediante un puerto.
- Mantener el `applicationId` en consultas que verifican pertenencia. No reemplazar estas verificaciones por una búsqueda global por ID.
- Mantener las reglas de redondeo y fechas existentes; reutilizar las funciones comunes.
- Coordinar operaciones atómicas mediante un puerto transaccional cuando el caso de uso atraviesa varios repositorios. El adaptador es dueño del SQL y los bloqueos.
- Errores externos se clasifican mediante un puerto; su respuesta HTTP se traduce con el filtro global. No copiar mensajes internos del ORM al cliente.

## Cambios de contrato HTTP

`test/contracts/http-routes.json` registra los decoradores anteriores a la reorganización. Una nueva ruta o un cambio de autorización requiere actualizar conscientemente el contrato y sus pruebas. No regenerar automáticamente el archivo para ocultar diferencias de una refactorización.

## Criterio de finalización

La compilación, los tipos, las reglas de arquitectura, las pruebas de reglas, la composición de Nest y las pruebas HTTP deben pasar. Para cambios de persistencia o integraciones externas, ejecutar además las pruebas de integración correspondientes en un entorno aislado; `verify` no modifica datos reales.

## DTOs y validación con Zod

Para un DTO nuevo, usa un esquema como fuente de tipos y validación:

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateProductSchema = z.strictObject({
  name: z.string().min(1).max(120),
  active: z.boolean().optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
```

En un DTO migrado, modifica su `static schema` y conserva coherentes las propiedades TypeScript y Swagger. No combines el esquema con decoradores de class-validator o class-transformer. Usa los esquemas comunes para entradas multipart y mensajes comunes en español.

Distingue `.optional()` (omisión), `.nullable()` (null) y `.nullish()` (ambos). Para formularios contables que permiten vacío utiliza `optionalValue`. No uses `z.coerce.boolean()` con cadenas: `"false"` es una cadena no vacía y se convertiría a `true`. Usa `booleanInput` u `optionalBooleanInput`. Añade pruebas de campos desconocidos, errores anidados y condiciones de negocio relevantes.

## Rutas sensibles y tareas programadas

Las rutas públicas de autenticación usan `@AuthRateLimit` con su política explícita. No registres `ThrottlerGuard` como guard global sin revisar el contrato de las otras rutas. Los casos de uso siguen dependiendo de `TokenService`; la firma JWT se configura en `TokenModule`.

Registra nuevos temporizadores en `SchedulerRegistry` con nombres únicos y verifica su limpieza. Conserva la prevención de solapamientos en trabajos asíncronos. No agregues otro `ScheduleModule.forRoot()` para cada área. Para despliegues con réplicas, define coordinación distribuida antes de duplicar tareas.
