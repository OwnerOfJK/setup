# Database Guide: MySQL vs PostgreSQL & Database Access Patterns

## MySQL vs PostgreSQL - Key Differences

### 1. **Auto-incrementing Primary Keys**
- **MySQL**: `INT AUTO_INCREMENT PRIMARY KEY`
- **PostgreSQL**: `SERIAL PRIMARY KEY` or `INT GENERATED ALWAYS AS IDENTITY`

### 2. **Timestamp Handling**
- **MySQL**: `ON UPDATE CURRENT_TIMESTAMP` (built-in)
- **PostgreSQL**: Requires triggers for auto-update on row changes

### 3. **Parameterized Queries**
- **MySQL**: `?` placeholders
- **PostgreSQL**: `$1, $2, $3` numbered placeholders

### 4. **Getting Inserted IDs**
- **MySQL**: `LAST_INSERT_ID()` (separate query)
- **PostgreSQL**: `RETURNING id` clause (single query)

### 5. **Identifier Quoting**
- **MySQL**: Backticks `` `table_name` ``
- **PostgreSQL**: Double quotes `"table_name"`

### 6. **Case Sensitivity**
- **MySQL**: Case-insensitive by default
- **PostgreSQL**: Case-sensitive, unquoted names folded to lowercase

### 7. **Table Truncation**
- **MySQL**: `TRUNCATE TABLE table_name`
- **PostgreSQL**: `TRUNCATE TABLE table_name RESTART IDENTITY CASCADE`

## Database Access Patterns - When to Use What

### 1. **Direct Database Drivers (node-postgres/pg)**
```typescript
import { Client } from 'pg'
const result = await client.query('SELECT * FROM users WHERE id = $1', [1])
```

**Use for:**
- Database setup scripts (create, migrate, seed)
- Complex, performance-critical queries
- Database-specific features (triggers, functions)
- Full control over SQL execution
- Administrative operations

**Benefits:**
- Maximum performance
- Full SQL capability
- Database-specific features
- Direct control over connections

**Drawbacks:**
- Manual SQL writing
- No type safety
- No cross-database compatibility
- More error-prone

### 2. **Query Builders (Knex.js)**
```typescript
const result = await knex('users')
  .where('id', 1)
  .select('username', 'email')
  .first()
```

**Use for:**
- Application business logic
- Dynamic query building (conditional WHERE clauses)
- Cross-database compatibility
- Reusable query patterns
- Type safety with TypeScript

**Benefits:**
- Write JavaScript, generates SQL
- Cross-database support
- Type safety
- Prevents SQL injection
- Composable queries

**Drawbacks:**
- Learning curve
- Some complex queries harder to express
- Slight performance overhead
- Limited to supported SQL features

### 3. **ORMs (Prisma, TypeORM, Sequelize)**
```typescript
const users = await prisma.user.findMany({
  where: { 
    email: { contains: '@example.com' }
  },
  include: { posts: true }
})
```

**Use for:**
- Complex domain models with relationships
- Rapid application development
- Schema-first development
- Automatic migrations
- Team projects with varying SQL skills

**Benefits:**
- Object-oriented thinking
- Automatic relationship handling
- Built-in validation
- Schema migrations
- Type safety
- Cross-database compatibility

**Drawbacks:**
- Performance overhead
- Steeper learning curve
- Abstracts away SQL knowledge
- May generate inefficient queries
- Less control over database interactions

## Decision Framework

### Choose **Direct Driver** when:
- ✅ Writing database setup/migration scripts
- ✅ Performance is critical
- ✅ Using database-specific features
- ✅ Full control over SQL is needed
- ✅ You're comfortable writing raw SQL

### Choose **Query Builder** when:
- ✅ Building application APIs
- ✅ Need cross-database support
- ✅ Writing dynamic queries
- ✅ Want type safety with TypeScript
- ✅ Team has moderate SQL knowledge

### Choose **ORM** when:
- ✅ Complex domain models
- ✅ Rapid development needed
- ✅ Team has varying SQL skills
- ✅ Schema changes are frequent
- ✅ Object-oriented design preferred

## Best Practice Stacks

### **Production Web Application** (Your current approach)
```
Direct Driver + Query Builder
├── node-postgres (pg) - Database scripts, migrations
├── Knex.js - Application logic, repositories
└── PostgreSQL - Database
```

### **Enterprise Application**
```
ORM + Query Builder + Direct Driver
├── Prisma/TypeORM - Business logic, models
├── Knex.js - Complex queries, reporting
├── node-postgres - Database administration
└── PostgreSQL - Database
```

### **Simple CRUD Application**
```
ORM Only
├── Prisma - Everything
└── PostgreSQL - Database
```

### **Data-Intensive Application**
```
Direct Driver + Query Builder
├── node-postgres - Everything
├── Knex.js - Optional for simple queries
└── PostgreSQL - Database
```

## Key Takeaways

1. **Know your database**: PostgreSQL vs MySQL differences matter for migrations
2. **Right tool for the job**: Different patterns excel at different use cases
3. **Layer your approach**: Your current stack (direct + query builder) is excellent
4. **Consider team skills**: ORMs help teams with varying SQL expertise
5. **Performance vs productivity**: Direct drivers fastest, ORMs most productive

Your current approach of using direct pg for database scripts and Knex for application logic hits the sweet spot for most production applications!