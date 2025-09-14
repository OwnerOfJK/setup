# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development and Testing
- `npm run dev` - Start development server with hot reload
- `npm run test` - Run all tests with coverage
- `npm run test:run` - Run tests without coverage
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically

### Build and Production
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run standalone` - Run as standalone executable (bypasses fastify-cli)

### Database Operations
- `docker compose up` - Start PostgreSQL database
- `npm run db:create` - Create database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:drop` - Drop database

## Project Architecture

This is a Fastify-based task management API built with TypeScript and PostgreSQL. The project follows a modular monolith architecture.

### Core Structure
- **`src/app.ts`** - Main application entry point, registers plugins and routes via fastify-autoload
- **`src/server.ts`** - Standalone server executable for production deployment
- **`src/plugins/external/`** - External dependencies (PostgreSQL, CORS, Swagger, rate limiting, etc.)
- **`src/plugins/app/`** - Application-specific plugins (repositories, file managers, auth)
- **`src/routes/`** - API endpoints organized by feature (users, tasks, auth)
- **`src/schemas/`** - TypeBox schemas for request/response validation

### Database Layer
- Uses **PostgreSQL** with **Knex** query builder
- **Postgrator** for database migrations
- Database scripts in `scripts/` folder (create, drop, migrate, seed)
- Database configuration loaded from environment variables

### Plugin System
The application loads plugins in three phases:
1. **External plugins** - Third-party Fastify plugins (CORS, security, etc.)
2. **App plugins** - Business logic repositories and shared functionality
3. **Routes** - API endpoints with auto-hook support

### Testing
- Tests use Node.js built-in test runner with `tsx` for TypeScript support
- `c8` for coverage reporting
- Test fixtures and helper functions in `test/` directory

### Environment Variables
Key configuration in `.env` (note: the README mentions MySQL but the project has been migrated to PostgreSQL):
- `POSTGRES_*` variables for database connection
- `COOKIE_SECRET` and `COOKIE_NAME` for session management
- `RATE_LIMIT_MAX` for API rate limiting
- `CAN_CREATE_DATABASE`, `CAN_DROP_DATABASE`, `CAN_SEED_DATABASE` for safety controls

### Development Notes
- TypeScript compilation outputs to `dist/` directory
- Uses `concurrently` for dev mode with TypeScript watcher and server restart
- Fastify autoload automatically discovers and registers plugins/routes
- Modular structure supports future extraction to microservices