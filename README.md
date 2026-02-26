# Markap Backend

## Pasos de ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y configurar
cp .env.example .env
# Editar .env y configurar DATABASE_URL (MySQL)

# 3. Generar cliente Prisma
npx prisma generate

# 4. Aplicar schema a la base de datos (ver sección Migraciones)
npx prisma db push

# 5. (Opcional) Poblar datos iniciales
npm run prisma:seed

# 6. Iniciar servidor en modo desarrollo
npm run start:dev
```

La API estará disponible en `http://localhost:3000/api`

---

## Migraciones

El proyecto usa **MySQL** y Prisma. Según el entorno, usa uno de estos comandos:

### `prisma db push` (recomendado en hosting / cPanel)

Sincroniza el `schema.prisma` con la base de datos **sin** generar archivos de migración. No requiere que el usuario de la BD pueda crear bases de datos.

- **Cuándo usarlo:** En hosting compartido (cPanel), donde el usuario MySQL normalmente no tiene permiso para crear bases de datos.
- **Después de cambiar el schema:** ejecuta de nuevo `npx prisma db push` y, si hace falta, `npx prisma generate`.

```bash
npx prisma db push
```

### `prisma migrate dev` (desarrollo local con MySQL con permisos)

Crea archivos de migración y los aplica. Requiere que el usuario de la BD pueda **crear bases de datos**, porque Prisma usa una “shadow database” para calcular los cambios.

- **Cuándo usarlo:** En desarrollo local con un MySQL donde el usuario tenga permiso para crear bases de datos.
- **Nota:** En cPanel/hosting típico fallará con un error de “shadow database” o “permission denied” al crear la BD auxiliar.

```bash
npx prisma migrate dev --name nombre_descriptivo
```

### Resumen

| Comando                 | Uso                                                                 |
|-------------------------|---------------------------------------------------------------------|
| `npx prisma db push`    | Sincronizar schema con la BD. Sin historial de migraciones. cPanel. |
| `npx prisma migrate dev`| Crear y aplicar migraciones. Requiere usuario con CREATE DATABASE.  |
| `npx prisma generate`  | Regenerar el cliente Prisma tras cambiar el schema.                 |
