# Migration from Knex + Postgrator to Drizzle ORM: Learnings & Insights

## Overview

This document captures the key learnings from migrating a PostgreSQL-based application from Knex (query builder) + Postgrator (migration tool) to Drizzle ORM (type-safe ORM). The migration was performed on a Fastify backend with TypeScript.

## Why Migrate?

### The Problem with Knex

**Before Migration:**
```typescript
// Knex - No type safety
const user = await knex('users')
  .select('id', 'emial')  // Typo - only caught at runtime
  .where({ emial: 'test@example.com' })  // Another typo
```

**Key Issues:**
- No compile-time type checking: Column name typos only discovered at runtime
- No autocompletion: Developers need to remember exact column names
- String-based queries: Prone to typos and refactoring risks
- Manual schema synchronization: Database schema changes required manual updates to TypeScript types

### The Drizzle Advantage

**After Migration:**
```typescript
// Drizzle - Type safe
const user = await db
  .select({ id: users.id, emial: users.emial })  // TypeScript error!
  .from(users)
  .where(eq(users.emial, 'test@example.com'))  // TypeScript error!
```

**Key Benefits:**
- Compile-time type safety: Errors caught before runtime
- Full autocompletion: IDE support for all tables and columns
- Refactoring safety: Renaming columns updates all usages automatically
- Single source of truth: Schema definitions serve as both database structure and TypeScript types

## Architectural Considerations

### Schema Organization

**Option 1: Separate Database Package (Rejected)**
- Initial approach: Treat db/ as separate npm package
- Issues: Complex dependency management, over-engineering for basic setup
- Learning: Keep it simple unless you need microservices

**Option 2: External Plugin (Current)**
- Drizzle as external plugin in plugins/external/
- Benefits: Consistent with Fastify plugin architecture
- Clean separation of concerns

**Option 3: Schema Location**
- Final decision: backend/src/db/schema/
- Benefits: Co-located with application code, simple imports, no package complexity

### Type Safety Spectrum

The application now has protection at three layers:

1. **Development Time**: TypeScript catches database query errors
2. **Runtime**: TypeBox validates API requests/responses
3. **Database**: PostgreSQL enforces actual constraints

```
API Request → TypeBox Validation → Drizzle Type Safety → PostgreSQL Constraints
```

## Migration Process

### 1. Dependencies & Setup

```bash
# Remove old dependencies
npm uninstall knex postgrator

# Add Drizzle dependencies
npm install drizzle-orm drizzle-kit pg
```

### 2. Schema Definition

**Before (SQL migrations only):**
```sql
-- migrations/001_create_users.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- etc.
);
```

**After (TypeScript schema):**
```typescript
// backend/src/db/schema/users.ts
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // Type-safe schema definition
})
```

### 3. Repository Layer Transformation

**Knex Repository:**
```typescript
async findByEmail(email: string, trx?: Knex) {
  const user = await (trx ?? knex)('users')
    .select('id', 'username', 'password', 'email')
    .where({ email })
    .first()
  return user
}
```

**Drizzle Repository:**
```typescript
async findByEmail(email: string, trx?: NodePgDatabase<typeof schema>) {
  const result = await (trx ?? db)
    .select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return result[0]
}
```

### 4. Migration System

**Postgrator → Drizzle Migrations:**

**Before: Postgrator**
```typescript
import Postgrator from 'postgrator'
const postgrator = new Postgrator({
  migrationPattern: path.join(migrationDir, '*'),
  driver: 'pg',
  // ...
})
```

**After: Drizzle**
```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator'
await migrate(db, { migrationsFolder: './drizzle' })
```

## Key Learnings

### 1. Type Safety is Worth It

- **Development Experience**: Autocompletion and inline errors significantly speed up development
- **Refactoring Confidence**: Rename columns/tables with confidence that all usages will update
- **New Developer Onboarding**: Schema serves as living documentation

### 2. Architecture Matters

- **Keep it Simple**: For basic setups, avoid over-engineering with separate packages
- **Consistent Patterns**: Follow existing patterns (like Fastify's plugin system)
- **Import Strategy**: Relative imports with explicit extensions for ES modules

### 3. Migration Strategy

- **Incremental Changes**: Replace one component at a time
- **Maintain API Compatibility**: Keep existing API interfaces while changing implementation
- **Test Thoroughly**: Ensure all database operations work with new ORM

### 4. TypeScript Configuration

- **ES Modules**: Require explicit file extensions for relative imports
- **Type Definitions**: Proper typing of database instances and transactions
- **Import Paths**: Consistent path structure across the application

## Trade-offs

### Pros of Drizzle

- ✅ Excellent TypeScript integration
- ✅ Great developer experience
- ✅ Compile-time error catching
- ✅ Modern, actively maintained
- ✅ Flexible migration system

### Cons to Consider

- ❌ Learning curve for team members
- ❌ Slightly more verbose syntax for simple queries
- ❌ Additional build step for type generation

## When to Choose Drizzle

- TypeScript codebase
- Team values type safety and developer experience
- Willing to invest in learning modern tooling
- Long-term project where maintenance matters

## When to Stick with Knex

- JavaScript codebase
- Simple projects with minimal database operations
- Team already proficient with Knex
- Need for raw SQL flexibility

## Conclusion

The migration from Knex to Drizzle represents a significant upgrade in type safety and developer experience. While requiring some initial investment in setup and learning, the long-term benefits of compile-time type checking, better autocompletion, and refactoring safety make it worthwhile for TypeScript projects.

The key insight is that type safety isn't just about preventing errors—it's about enabling developers to work more confidently and efficiently. When you can trust that your database queries are correct before running them, development becomes faster and more enjoyable.

**Final Recommendation**: For any TypeScript project with database operations, strongly consider using a type-safe ORM like Drizzle. The initial setup complexity pays for itself many times over in reduced bugs and improved developer productivity.