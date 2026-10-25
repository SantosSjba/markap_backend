# Logging con Pino

## Configuración y salida

`LoggingModule` configura una sola integración `nestjs-pino` para NestJS y HTTP. La configuración vive en `src/shared/infrastructure/logging/logger.config.ts`; el entorno se valida con Zod. `main.ts` usa `bufferLogs` y conecta el adaptador de Nest antes de inicializar la aplicación. También habilita los hooks de cierre.

La salida normal es JSON por stdout, lista para el recolector de logs del despliegue. No se escriben archivos locales ni se implementa rotación dentro del servidor. Un fallo de arranque utiliza la misma configuración y un destino síncrono por stderr para conservar el evento antes de salir.

| Variable      | Valor por defecto         | Uso                                                               |
| ------------- | ------------------------- | ----------------------------------------------------------------- |
| `LOG_LEVEL`   | `info`; `silent` en tests | `trace`, `debug`, `info`, `warn`, `error`, `fatal` o `silent`.    |
| `LOG_PRETTY`  | `false`                   | Vista legible con `pino-pretty`, únicamente fuera de producción.  |
| `APP_VERSION` | omitida                   | Versión o revisión del despliegue para correlacionar incidencias. |

Producción rechaza `LOG_PRETTY=true`. `pino-pretty` es una dependencia de desarrollo. No hace falta modificar `.env` para habilitar el logger.

## Estructura

```json
{
  "level": "info",
  "time": "2026-10-25T20:00:00.000Z",
  "service": "markap-api",
  "environment": "production",
  "context": "HTTP",
  "event": "http.request.completed",
  "requestId": "4c4febce-f53d-4057-a69f-d25ba460485a",
  "req": { "id": "4c4febce-f53d-4057-a69f-d25ba460485a", "method": "GET" },
  "route": "/api/properties/:id",
  "res": { "statusCode": 200 },
  "responseTime": 12,
  "msg": "Solicitud HTTP completada"
}
```

`context` identifica el componente; `event` es un nombre estable para búsquedas y métricas. `msg` describe la operación. Los valores variables se pasan como campos, sin concatenar excepciones u objetos completos dentro del texto. Los mensajes internos emitidos por Nest reciben el evento predeterminado `application.log`.

## HTTP y errores

- `nestjs-pino` propaga el contexto de cada solicitud mediante AsyncLocalStorage. Los logs de un servicio dentro de una solicitud incluyen el mismo `requestId`, incluso con solicitudes concurrentes.
- El encabezado `X-Request-Id` entrante se conserva si contiene entre 1 y 128 caracteres seguros. En otro caso se genera un UUID. Se devuelve el identificador en la respuesta y se expone mediante CORS.
- Cada solicitud produce un registro final: `info` para éxito, `warn` para 4xx y `error` para errores o 5xx. Incluye estado y duración en milisegundos.
- Se registra la plantilla de la ruta, como `/api/properties/:id`, en lugar de la URL recibida. Las rutas sin coincidencia se identifican como `unmatched`.
- El filtro global conserva la respuesta pública existente y adjunta el error original a `res.err`. El middleware emite el registro final. El filtro no emite otro log del mismo fallo.

El serializador de errores incluye `type`, `code` si corresponde y hasta 20 frames de `stack`. No copia mensajes arbitrarios de proveedores: pueden contener SQL, parámetros o datos personales. La operación fallida queda descrita por `event`, `context` y `msg`. Los errores de entorno incluyen además `fields`, con los nombres de las variables inválidas, nunca sus valores.

## Eventos de componentes

| Componente | Eventos principales                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Arranque   | `application.started`, `application.startup.failed`                                                                                  |
| HTTP       | `http.request.completed`, `http.request.rejected`, `http.request.failed`                                                             |
| Prisma     | `database.connected`, `database.disconnected`, `database.client.warning`, `database.client.error`                                    |
| MinIO      | `storage.bucket.created`, `storage.bucket.ensure.failed`                                                                             |
| Correo     | `mail.delivery.sent`, `mail.delivery.skipped`                                                                                        |
| Alertas    | `rental_alerts.scheduler.started`, `rental_alerts.scheduler.disabled`, `rental_alerts.batch.completed`, `rental_alerts.batch.failed` |
| Scripts    | `seed.progress`, `seed.failed`, `migration.progress`, `migration.failed`, `schema_inspection.progress`                               |

Las ejecuciones de alertas incluyen `runId`, origen y duración. Los fallos del cliente Prisma se registran a nivel `debug`; el resultado del flujo se registra en HTTP o en la tarea que lo ejecutó. No se habilitan logs de consultas o parámetros SQL.

Los seeds y scripts de Prisma usan `createScriptLogger`, con un único logger raíz y un contexto por archivo. Su salida JSON predeterminada es síncrona para conservar los registros antes de `process.exit`. Los comandos de desarrollo que producen diagnósticos, como el verificador de arquitectura, conservan su salida de terminal; no forman parte del logger de la aplicación.

## Datos sensibles

No se registran cuerpos de solicitudes, cabeceras, cookies, parámetros de consulta, HTML de correos, archivos, tokens o contraseñas. Hay redacción defensiva para campos sensibles en la raíz y dos niveles anidados. Esta redacción no sustituye a seleccionar metadatos explícitos: no se deben pasar objetos de usuario o configuración completos al logger.

Cuando SMTP no está configurado se registra `mail.delivery.skipped`, sin imprimir destinatarios, asunto, códigos de recuperación ni HTML. Los seeds tampoco imprimen la contraseña del administrador o su correo. Los scripts de migración no imprimen la URL de conexión o errores SQL crudos.

## Agregar logs

En servicios de infraestructura o presentación:

```ts
constructor(private readonly logger: PinoLogger) {
  this.logger.setContext(MyService.name);
}

this.logger.info(
  { event: 'operation.completed', itemCount: result.count },
  'Operación completada',
);
```

Usa `PinoLogger` como dependencia transitoria. No construyas otro logger raíz ni uses `console.*` o `new Logger()` en el servidor. Si una regla del dominio necesita publicar un evento, define un puerto; no introduzcas Pino en el dominio ni la aplicación.

Registra el error una sola vez en el límite responsable de completar el flujo. Para detalles técnicos adicionales usa `debug`, sin incluir contenido sensible. En scripts fuera de Nest usa `createScriptLogger('Script:nombre')`.

## Verificación

`pnpm verify` comprueba tipos, lint, compilación, arquitectura y pruebas. Las pruebas del logger verifican JSON, redacción, serialización segura, niveles HTTP, request IDs, aislamiento entre solicitudes concurrentes y ausencia de logs de error duplicados. No ejecutan seeds, migraciones ni llamadas a servicios externos.

Referencias: [nestjs-pino](https://github.com/iamolegga/nestjs-pino), [Pino](https://github.com/pinojs/pino), [pino-http](https://github.com/pinojs/pino-http).
