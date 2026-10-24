# Despliegue de producción

Coolify compila el Dockerfile de `SantosSjba/markap_backend`, rama `main`, en la aplicación existente `api-markap`.
Las variables de base de datos, MinIO, correo y autenticación se conservan en Coolify. No cargar `.env` del repositorio.

El entrypoint ejecuta `prisma migrate deploy` y detiene el arranque si falla una migración.
No se ejecutan `db push`, resets ni seeds en producción.

La migración `20261024000000_baseline` representa el esquema existente. En la base de producción se registra como aplicada, sin ejecutar su SQL. Las tablas legacy `interior_budget_*` se conservan aunque no estén modeladas en Prisma.

Para futuros cambios de esquema, añadir una migración SQL versionada en `prisma/migrations/<fecha>_<descripcion>/migration.sql`, probarla con una copia y revisar que sea aditiva. No eliminar tablas legacy ni columnas con datos. No usar `--accept-data-loss`.
Crear un respaldo antes de migrar. Los cambios que requieran transformar datos necesitan una migración revisada específicamente.

El frontend se compila desde `SantosSjba/markap_frontend`, rama `main`, en `front-markap`. La URL de API se define como argumento de compilación en su Dockerfile.

## Flujo habitual

1. Integrar los cambios y las migraciones necesarias en `main`.
2. Ejecutar las pruebas y subir con `git push origin main`.
3. GitHub notifica a Coolify, que compila una imagen nueva y verifica `/api/health`.
4. Consultar Deployments en `api-markap` para comprobar el resultado.

La activación inicial se validó el 24/10/2026 restaurando un respaldo en una base local independiente: 164 tablas y 2.869 filas de negocio conservaron sus huellas antes y después del registro de la baseline. La misma comprobación en producción tampoco detectó diferencias. El único registro nuevo corresponde al historial técnico `_prisma_migrations`.
