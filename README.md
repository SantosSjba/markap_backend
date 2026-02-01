# Markap Backend

Backend API built with **NestJS**, **Prisma**, and **PostgreSQL** following **Clean Architecture** principles.

## Architecture Overview

```
src/
├── application/          # Application Layer (Business Logic)
│   ├── entities/         # Domain entities (pure business objects)
│   ├── exceptions/       # Domain/application exceptions
│   ├── repositories/     # Repository interfaces (contracts)
│   └── use-cases/        # Application use cases (business rules)
│
├── infrastructure/       # Infrastructure Layer
│   ├── database/         # Database implementation
│   │   ├── prisma/       # Prisma ORM
│   │   │   ├── mappers/  # Entity <-> Prisma model mappers
│   │   │   └── repositories/ # Repository implementations
│   │   └── database.module.ts
│   │
│   └── http/             # HTTP layer
│       ├── controllers/  # REST controllers
│       ├── dtos/         # Data Transfer Objects
│       ├── mappers/      # DTO <-> Entity mappers
│       └── http.module.ts
│
├── common/               # Shared utilities
│   ├── decorators/       # Custom decorators
│   ├── filters/          # Exception filters
│   ├── guards/           # Auth guards
│   ├── interceptors/     # HTTP interceptors
│   └── pipes/            # Validation pipes
│
├── config/               # Configuration
│   └── env.config.ts     # Environment variables
│
├── app.module.ts         # Root module
└── main.ts               # Application entry point

prisma/
├── schema.prisma         # Prisma schema
└── migrations/           # Database migrations
```

## Clean Architecture Layers

### 1. Application Layer (`src/application/`)
Contains pure business logic, independent of frameworks and external services.

- **Entities**: Core business objects with their own validation rules
- **Use Cases**: Application-specific business rules
- **Repositories**: Abstract interfaces for data access
- **Exceptions**: Domain-specific errors

### 2. Infrastructure Layer (`src/infrastructure/`)
Contains all external concerns and framework-specific code.

- **Database**: Prisma implementation of repositories
- **HTTP**: Controllers, DTOs, and request/response handling

### 3. Common Layer (`src/common/`)
Shared utilities and cross-cutting concerns.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your DATABASE_URL in .env file

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Start development server
npm run start:dev
```

### Available Scripts

```bash
# Development
npm run start:dev       # Start in watch mode

# Database (Prisma)
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate:dev  # Create and run migrations
npm run prisma:studio       # Open Prisma Studio
npm run prisma:push         # Push schema to database

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:cov        # Test coverage

# Linting
npm run lint            # Fix linting issues
npm run format          # Format code
```

## Creating a New Module

When adding a new feature, follow this structure:

1. **Entity** (`src/application/entities/`):
   ```typescript
   // user.entity.ts
   export class User {
     constructor(
       public readonly id: string,
       public readonly email: string,
       public readonly name: string,
     ) {}
   }
   ```

2. **Repository Interface** (`src/application/repositories/`):
   ```typescript
   // user.repository.ts
   export abstract class UserRepository {
     abstract findById(id: string): Promise<User | null>;
     abstract create(user: User): Promise<void>;
   }
   ```

3. **Use Case** (`src/application/use-cases/`):
   ```typescript
   // create-user.use-case.ts
   @Injectable()
   export class CreateUserUseCase {
     constructor(private userRepository: UserRepository) {}
     async execute(data: CreateUserInput): Promise<User> { ... }
   }
   ```

4. **Prisma Repository** (`src/infrastructure/database/prisma/repositories/`):
   ```typescript
   // prisma-user.repository.ts
   @Injectable()
   export class PrismaUserRepository implements UserRepository { ... }
   ```

5. **Controller** (`src/infrastructure/http/controllers/`):
   ```typescript
   // user.controller.ts
   @Controller('users')
   export class UserController { ... }
   ```

## API Documentation

Once running, access the API at:
- Base URL: `http://localhost:3000/api`

## License

UNLICENSED
