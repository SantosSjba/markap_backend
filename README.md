# Markap Backend

## Pasos de ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y configurar
cp .env.example .env
# Editar .env y configurar DATABASE_URL (PostgreSQL)

# 3. Generar cliente Prisma
npx prisma generate

# 4. Ejecutar migraciones (crea/applica migraciones a la BD)
npx prisma migrate dev

# 5. (Opcional) Poblar datos iniciales
npm run prisma:seed

# 6. Iniciar servidor en modo desarrollo
npm run start:dev
```

La API estará disponible en `http://localhost:3000/api`
