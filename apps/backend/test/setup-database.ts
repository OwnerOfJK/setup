import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as schema from '../db/schema/index.js'

export interface TestDatabase {
  container: StartedTestContainer
  pool: Pool
  db: ReturnType<typeof drizzle<typeof schema>>
}

let testDatabase: TestDatabase | null = null

export async function setupTestDatabase(): Promise<TestDatabase> {
  if (testDatabase) {
    return testDatabase
  }

  // Start PostgreSQL container
  const container = await new GenericContainer('postgres:16')
    .withEnv('POSTGRES_PASSWORD', 'testpass')
    .withEnv('POSTGRES_DB', 'testdb')
    .withEnv('POSTGRES_USER', 'testuser')
    .withExposedPorts(5432)
    .start()

  // Create connection pool
  const pool = new Pool({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: 'testuser',
    password: 'testpass',
    database: 'testdb',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  })

  // Create Drizzle instance
  const db = drizzle(pool, { schema })

  // Run migrations
  try {
    await migrate(db, { migrationsFolder: './src/db/drizzle' })
    console.log('Test database migrations completed successfully')
  } catch (error) {
    console.error('Failed to run migrations:', error)
    await cleanupTestDatabase()
    throw error
  }

  // Seed test data
  try {
    const { seedTestData } = await import('./seed-test-data.js')
    await seedTestData(db)
    console.log('Test data seeded successfully')
  } catch (error) {
    console.error('Failed to seed test data:', error)
    await cleanupTestDatabase()
    throw error
  }

  testDatabase = { container, pool, db }
  return testDatabase
}

export async function cleanupTestDatabase(): Promise<void> {
  if (!testDatabase) {
    return
  }

  const { container, pool } = testDatabase

  try {
    await pool.end()
  } catch (error) {
    console.error('Error closing pool:', error)
  }

  try {
    await container.stop()
  } catch (error) {
    console.error('Error stopping container:', error)
  }

  testDatabase = null
}

export function getTestDatabase(): TestDatabase | null {
  return testDatabase
}