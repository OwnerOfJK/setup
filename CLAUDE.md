# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Development Environment
- `docker compose up` - Start all services (PostgreSQL, backend, frontend)
- `docker compose down` - Stop all services

### Backend Development (cd backend/)
- `npm run dev` - Start development server with hot reload
- `npm run test` - Run all tests with coverage
- `npm run test:run` - Run tests without coverage
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically

### Backend Build and Production
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run standalone` - Run as standalone executable (bypasses fastify-cli)

### Database Operations (cd db/)
- `npm run db:create` - Create database (requires CAN_CREATE_DATABASE=1)
- `npm run db:drop` - Drop database (requires CAN_DROP_DATABASE=1)
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data (requires CAN_SEED_DATABASE=1)

## Project Architecture

This is a full-stack application with Fastify backend, React frontend, and PostgreSQL database. Each component is containerized with Docker.

### Core Structure
- **`backend/`** - Node.js/Fastify API server with TypeScript
- **`frontend/`** - React frontend with TypeScript (container exists but not implemented)
- **`db/`** - Database scripts and migrations
- **`docker-compose.yml`** - Orchestrates all services

### Backend Architecture (backend/)
- **`src/app.ts`** - Main application entry point, registers plugins and routes via fastify-autoload
- **`src/server.ts`** - Standalone server executable for production deployment
- **`src/plugins/external/`** - External dependencies (PostgreSQL, CORS, Swagger, rate limiting, etc.)
- **`src/plugins/app/`** - Application-specific plugins (repositories, file managers, auth)
- **`src/routes/`** - API endpoints organized by feature (users, tasks, auth)
- **`src/schemas/`** - TypeBox schemas for request/response validation

### Database Layer
- Uses **PostgreSQL 16** with **Knex** query builder
- **Postgrator** for database migrations
- Database scripts in `db/scripts/` folder (create, drop, migrate, seed)
- Database configuration loaded from environment variables
- Safety controls: CAN_CREATE_DATABASE, CAN_DROP_DATABASE, CAN_SEED_DATABASE

### Plugin System
The application loads plugins in three phases:
1. **External plugins** - Third-party Fastify plugins (CORS, security, etc.)
2. **App plugins** - Business logic repositories and shared functionality
3. **Routes** - API endpoints with auto-hook support

### Testing
- Tests use Node.js built-in test runner with `tsx` for TypeScript support
- `c8` for coverage reporting
- Test fixtures and helper functions in `test/` directory
- Tests automatically seed database before running

### Environment Variables
Key configuration in `.env`:
- `NODE_ENV` - Always set to production (required for Docker)
- `POSTGRES_*` variables for database connection
- `COOKIE_SECRET` and `COOKIE_NAME` for session management
- `RATE_LIMIT_MAX` for API rate limiting
- `CAN_CREATE_DATABASE`, `CAN_DROP_DATABASE`, `CAN_SEED_DATABASE` for safety controls

### Development Notes
- TypeScript compilation outputs to `dist/` directory
- Uses `concurrently` for dev mode with TypeScript watcher and server restart
- Fastify autoload automatically discovers and registers plugins/routes
- Modular structure supports future extraction to microservices
- All services are containerized and orchestrated with Docker Compose