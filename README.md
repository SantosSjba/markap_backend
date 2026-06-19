# Markap Backend

El proyecto sigue **Clean Architecture** con NestJS y Prisma.

- **[Arquitectura](docs/ARCHITECTURE.md)** — Capas (domain, application, infrastructure), puertos y adaptadores.
- **[Cómo agregar funcionalidades](docs/ADDING_FEATURES.md)** — Pasos para nuevos recursos, use cases y servicios.

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) 11 (`corepack enable pnpm`)

## Pasos de ejecución

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno y configurar
cp .env.example .env
# Editar .env y configurar DATABASE_URL (Neon PostgreSQL)

# 3. Generar cliente Prisma
pnpm exec prisma generate

# 4. Aplicar schema a la base de datos (ver sección Migraciones)
pnpm exec prisma db push

# 5. (Opcional) Poblar datos iniciales
pnpm run prisma:seed

# 6. Iniciar servidor en modo desarrollo
pnpm run start:dev
```

La API estará disponible en `http://localhost:3000/api`

---

## Migraciones

El proyecto usa **PostgreSQL (Neon)** y Prisma. Según el entorno, usa uno de estos comandos:

### `prisma db push` (recomendado para Neon / desarrollo rápido)

Sincroniza el `schema.prisma` con la base de datos **sin** generar archivos de migración.

- **Cuándo usarlo:** Entornos donde quieres aplicar cambios directos al esquema sin mantener historial de migraciones.
- **Después de cambiar el schema:** ejecuta de nuevo `pnpm exec prisma db push` y, si hace falta, `pnpm exec prisma generate`.

```bash
pnpm exec prisma db push
```

### `prisma migrate dev` (desarrollo local con historial de migraciones)

Crea archivos de migración y los aplica. Requiere permisos para crear una **shadow database**.

- **Cuándo usarlo:** En desarrollo local cuando quieres versionar cambios del esquema.

```bash
pnpm exec prisma migrate dev --name nombre_descriptivo
```

### Resumen

| Comando                      | Uso                                                                 |
|------------------------------|---------------------------------------------------------------------|
| `pnpm exec prisma db push`   | Sincronizar schema con la BD sin historial de migraciones.          |
| `pnpm exec prisma migrate dev` | Crear y aplicar migraciones en desarrollo con shadow DB.          |
| `pnpm exec prisma generate`  | Regenerar el cliente Prisma tras cambiar el schema.                 |
