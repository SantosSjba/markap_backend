# Autenticación, límites de intentos y planificación

## JWT con NestJS

`TokenModule` registra `JwtModule` con configuración asíncrona e implementa el puerto de dominio `TokenService` mediante `JwtTokenService`. El dominio y los casos de uso no importan `@nestjs/jwt`.

La clave proviene de `JWT_SECRET`, sin claves alternativas de respaldo. `JWT_EXPIRES_IN` sigue expresándose en segundos y su valor predeterminado es 3600. La firma y verificación se restringen a HS256, el algoritmo que utilizaba el emisor anterior. Se conservan `accessToken`, `expiresIn` y los claims `sub` y `email`; estos claims se validan antes de devolverlos a los guards.

Los tokens anteriores que conserven firma y vencimiento válidos siguen funcionando mientras se mantenga la misma clave. No se cambian las contraseñas, sus hashes, los guards de usuario activo ni las reglas de autorización. `jsonwebtoken` y sus tipos dejaron de ser dependencias directas: el motor continúa siendo una dependencia de `@nestjs/jwt`.

Las pruebas incluyen un token real del adaptador anterior y rechazan tokens vencidos, manipulados, con otra clave, otro algoritmo o identidad incompleta.

## Límites de autenticación

`AuthRateLimitModule` configura `@nestjs/throttler`. El decorador compartido `@AuthRateLimit(...)` se aplica exclusivamente a estas rutas:

| Ruta                             | Intentos predeterminados por IP | Ventana y bloqueo |
| -------------------------------- | ------------------------------- | ----------------- |
| `POST /api/auth/login`           | 10                              | 60 segundos       |
| `POST /api/auth/forgot-password` | 3                               | 15 minutos        |
| `POST /api/auth/reset-password`  | 5                               | 15 minutos        |

Cada ruta mantiene su contador independiente. Se cuentan las solicitudes, incluidas las que terminan con datos inválidos o credenciales incorrectas. La solicitud que excede el límite se rechaza antes de ejecutar el caso de uso.

La respuesta utiliza HTTP 429, un mensaje en español y `Retry-After`. Las cabeceras de cuota y `Retry-After` se exponen mediante CORS. El resto de endpoints conserva sus reglas y no recibe este limitador de autenticación.

| Variable                      | Predeterminado |
| ----------------------------- | -------------- |
| `AUTH_LOGIN_LIMIT`            | `10`           |
| `AUTH_LOGIN_TTL_MS`           | `60000`        |
| `AUTH_FORGOT_PASSWORD_LIMIT`  | `3`            |
| `AUTH_FORGOT_PASSWORD_TTL_MS` | `900000`       |
| `AUTH_RESET_PASSWORD_LIMIT`   | `5`            |
| `AUTH_RESET_PASSWORD_TTL_MS`  | `900000`       |

Zod exige enteros positivos y ventanas que no desborden los temporizadores de Node. Los valores TTL y la duración del bloqueo están expresados en milisegundos.

### IP del cliente y proxies

La configuración predeterminada es `TRUST_PROXY=false`: una cabecera `X-Forwarded-For` enviada directamente por un cliente no cambia el contador. Si el servicio está detrás de un proxy, configura `TRUST_PROXY` con sus direcciones o subredes reales para que Express identifique a los clientes correctamente. No se adivinan redes del despliegue ni se confía en cualquier origen.

Se aceptan direcciones IPv4/IPv6, rangos CIDR y los grupos explícitos de Express `loopback`, `linklocal` y `uniquelocal`, separados por comas. Se rechazan la confianza global (`true`, `*`, redes `/0`) y los valores inválidos. El backend debe ser accesible a través de los proxies configurados conforme a las reglas de red del despliegue.

El almacén predeterminado es **memoria de cada instancia**. Los contadores se reinician al reiniciar el proceso. Para varias réplicas se necesita un almacén compartido compatible con Throttler; no se añade Redis como requisito de esta actualización.

## Tareas con @nestjs/schedule

`NotificationsModule` importa una única configuración `ScheduleModule.forRoot()`. `RentalAlertsScheduler` registra los temporizadores por nombre en `SchedulerRegistry`:

- `rental-alerts.startup`: ejecución inicial a los 15 segundos.
- `rental-alerts.interval`: ejecución periódica cada `RENTAL_ALERTS_INTERVAL_MS` (21600000 ms, seis horas, por defecto).

Se usa la API dinámica del registro para mantener la cadencia configurable existente, en lugar de sustituirla por una hora cron distinta. Los handles nativos se crean para registrarlos inmediatamente; no se conservan como estado privado. La limpieza utiliza el registro y el ciclo de vida de Nest.

`RENTAL_ALERTS_ENABLED=false` evita registrar y ejecutar ambas tareas. Zod valida la periodicidad positiva y su máximo compatible con Node. Se conserva el bloqueo local de solapamientos, la recuperación tras errores y los logs Pino con `runId`, origen, duración y resultados.

El planificador ejecuta tareas dentro de esta instancia. Para varias réplicas se necesita coordinar cuál ejecuta las alertas; `SchedulerRegistry` no es un bloqueo distribuido. La actualización conserva el modelo operativo anterior.

## Revisión de Excel

Se conservaron ambas dependencias por una diferencia funcional: el lector actual con `xlsx` admite importaciones `.xls` y `.xlsx`, mientras `exceljs` genera los reportes XLSX existentes. Se añadieron pruebas de importación de ambos formatos. Retirar el lector legacy sin reemplazar esa compatibilidad reduciría los formatos admitidos.

## Verificación

`pnpm verify` incluye pruebas de compatibilidad JWT, firma/vencimiento, temporizadores registrados, desactivación, limpieza, ausencia de solapamientos y recuperación tras fallos. Las pruebas HTTP usan las rutas reales de autenticación con puertos locales y servicios sustituidos: verifican 429, Retry-After, vencimiento del bloqueo, independencia de políticas y comportamiento con proxies confiables y cabeceras no confiables.

No se ejecutan migraciones, seeds ni operaciones sobre datos reales.

Referencias: [@nestjs/jwt](https://github.com/nestjs/jwt), [planificación](https://docs.nestjs.com/techniques/task-scheduling), [throttling](https://docs.nestjs.com/security/rate-limiting).
