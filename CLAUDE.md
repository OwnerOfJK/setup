# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Workspace Management (pnpm)
- `pnpm install` - Install all workspace dependencies
- `pnpm dev` - Run development mode for all packages (starts backend and frontend)
- `pnpm build` - Build all packages
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Lint all packages
- `pnpm lint:fix` - Fix linting errors for all packages

### Docker Development Environment
- `docker compose up` - Start all services (PostgreSQL, backend, frontend)
- `docker compose down` - Stop all services

### Database Operations (from root)
- `pnpm db:create` - Create database (requires CAN_CREATE_DATABASE=1)
- `pnpm db:drop` - Drop database (requires CAN_DROP_DATABASE=1)
- `pnpm db:migrate` - Run database migrations using Drizzle
- `pnpm db:seed` - Seed database with test data (requires CAN_SEED_DATABASE=1)
- `pnpm db:generate` - Generate Drizzle migrations from schema

### Backend Development (cd apps/backend/)
- `npm run dev` - Start development server with hot reload and TypeScript watcher
- `npm run test` - Run all tests with coverage (seeds database first)
- `npm run test:run` - Run tests without coverage
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server via fastify-cli
- `npm run standalone` - Run as standalone executable (bypasses fastify-cli)
- `npm run watch` - Start TypeScript watcher in development
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically

### Frontend Development (cd apps/frontend/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking and generate types

### Database Package (cd packages/db/)
- `npm run db:create` - Create database
- `npm run db:drop` - Drop database
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed test data
- `npm run db:generate` - Generate Drizzle migrations from schema definitions

### Testing Infrastructure
- Tests use Node.js built-in test runner with `tsx` for TypeScript support
- `c8` for coverage reporting
- Testcontainers for isolated database instances during testing
- Database is automatically seeded before running tests
- Backend tests use glob pattern matching: `glob -c "tsx --test" "./test/**/*.ts"`

## Project Architecture

This is a modern full-stack TypeScript application using a **pnpm workspace monorepo** structure with Fastify backend, React frontend, and PostgreSQL database. Each component is containerized with Docker and designed for microservices deployment.

### Project Structure
- **`apps/backend/`** - Node.js/Fastify API server with TypeScript
- **`apps/frontend/`** - React frontend with TypeScript using React Router v7
- **`packages/db/`** - Shared database package with Drizzle ORM and schemas
- **`packages/utils/`** - Shared utilities (currently minimal)
- **`docker-compose.yml`** - Orchestrates all services
- **`pnpm-workspace.yaml`** - Defines workspace configuration

### Monorepo Architecture
The project uses pnpm workspaces for:
- **Shared dependencies**: Database types and schemas shared between backend and other services
- **Type safety**: Full TypeScript integration from database to frontend
- **Microservices-ready**: Each app can be deployed independently
- **Efficient development**: Single command to run all services

### Backend Architecture (apps/backend/)
- **`src/app.ts`** - Main application entry point, registers plugins and routes via fastify-autoload
- **`src/server.ts`** - Standalone server executable for production deployment
- **`src/plugins/external/`** - External dependencies (PostgreSQL via Drizzle, CORS, Swagger, rate limiting, etc.)
- **`src/plugins/app/`** - Application-specific plugins (repositories, file managers, auth)
- **`src/routes/`** - API endpoints organized by feature (users, tasks, auth)
- **`src/schemas/`** - TypeBox schemas for request/response validation
- **Database**: Uses shared `@setup/db` workspace package and `@setup/utils` for utilities

### Frontend Architecture (apps/frontend/)
- **React Router v7** with TypeScript and server-side rendering
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- Multi-stage Docker build with separate development and production dependencies
- Builds to `build/` directory with server-side rendering support

### Database Package (packages/db/)
- **Shared database logic** exported to other workspace packages
- **Drizzle ORM** with PostgreSQL driver (`pg`) and connection pooling
- **Type-safe schema definitions** in `schema/` (users, roles, user-roles)
- **Migration management** with Drizzle Kit - generates SQL migrations from TypeScript schemas
- **Database scripts** (create, drop, migrate, seed) in `scripts/`
- **Drizzle config** at root with migration folder `drizzle/`
- Package name: `@setup/db` with dependency on `@setup/utils`

### Database Schema Structure
```typescript
// Current schema includes:
- users (id, email, username, password, created_at)
- roles (id, name, description)
- user_roles (user_id, role_id)
```

### Plugin System
The application loads plugins in three phases:
1. **External plugins** - Third-party Fastify plugins (CORS, security, Drizzle ORM, etc.)
2. **App plugins** - Business logic repositories and shared functionality
3. **Routes** - API endpoints with auto-hook support

### Testing
- Backend tests use Node.js built-in test runner with `tsx` for TypeScript support
- `c8` for coverage reporting
- Testcontainers for isolated database instances during testing
- Test fixtures and helper functions in `test/` directory
- Tests automatically seed database before running using test containers
- Frontend testing configured with React Router's built-in testing utilities

### Environment Variables
Key configuration in `.env`:
- `NODE_ENV` - Always set to production (required for Docker)
- `POSTGRES_*` variables for database connection
- `COOKIE_SECRET` and `COOKIE_NAME` for session management
- `RATE_LIMIT_MAX` for API rate limiting
- `CAN_CREATE_DATABASE`, `CAN_DROP_DATABASE`, `CAN_SEED_DATABASE` for safety controls

### Docker Configuration
Services:
- `db`: PostgreSQL 16 on port 5432 with health checks and persistent volume
- `backend`: Fastify API on port 3002 (builds from `./apps/backend`, waits for db health check)
- `frontend`: React app on port 3000 (builds from `./apps/frontend`, includes health check)

### Development Notes
- Backend TypeScript compilation outputs to `dist/` directory
- Uses `concurrently` for dev mode with TypeScript watcher and server restart
- Fastify autoload automatically discovers and registers plugins/routes
- Database migrations managed by Drizzle with TypeScript schema definitions
- Frontend uses React Router v7 with Vite for fast development
- Workspace structure with pnpm workspaces for shared dependency management
- Modular structure supports future extraction to microservices
- All services are containerized and orchestrated with Docker Compose
- Database testing uses testcontainers for isolated test environments
- NODE_ENV must always be set to "production" (required for Docker containers)
- Safety controls prevent accidental database operations in production (CAN_* flags)

### Recent Architecture Changes
- Migrated from Knex + Postgrator to Drizzle ORM for better type safety
- Restructured from individual directories to monorepo with workspaces
- Database logic extracted to shared `packages/db` workspace package
- Frontend updated to React Router v7 with server-side rendering
- Enhanced testing infrastructure with Testcontainers and coverage reporting