import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '../schema'

async function doMigration (): Promise<void> {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  })

  const db = drizzle(pool, { schema })

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migration completed!')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await pool.end()
  }
}

doMigration()