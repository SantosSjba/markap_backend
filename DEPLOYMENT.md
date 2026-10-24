# Despliegue de producción

Coolify compila el Dockerfile de `SantosSjba/markap_backend`, rama `main`, en la aplicación existente `api-markap`.
Las variables de base de datos, MinIO, correo y autenticación se conservan en Coolify. No cargar `.env` del repositorio.

El entrypoint ejecuta `prisma migrate deploy` y detiene el arranque si falla una migración.
No se ejecutan `db push`, resets ni seeds en producción.

La migración `20261024000000_baseline` representa el esquema existente. En la base de producción se registra como aplicada, sin ejecutar su SQL. Las tablas legacy `interior_budget_*` se conservan aunque no estén modeladas en Prisma.

Para futuros cambios de esquema, añadir una migración SQL versionada en `prisma/migrations/<fecha>_<descripcion>/migration.sql`, probarla con una copia y revisar que sea aditiva. No eliminar tablas legacy ni columnas con datos. No usar `--accept-data-loss`.
Crear un respaldo antes de migrar. Los cambios que requieran transformar datos necesitan una migración revisada específicamente.

El frontend se compila desde `SantosSjba/markap_frontend`, rama `main`, en `front-markap`. La URL de API se define como argumento de compilación en su Dockerfile.
