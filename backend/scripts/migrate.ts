import { Client, ClientBase } from 'pg'
import { QueryResult } from 'pg'
import path from 'node:path'
import fs from 'node:fs'
import Postgrator from 'postgrator'

interface PostgratorResult {
  rows: any;
  fields: QueryResult['fields'];
}

async function doMigration (): Promise<void> {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })
  await connection.connect()

  try {
    const migrationDir = path.join(import.meta.dirname, '../migrations')

    if (!fs.existsSync(migrationDir)) {
      throw new Error(
        `Migration directory "${migrationDir}" does not exist. Skipping migrations.`
      )
    }

    const postgrator = new Postgrator({
      migrationPattern: path.join(migrationDir, '*'),
      driver: 'pg',
      database: process.env.POSTGRES_DATABASE,
      execQuery: async (query: string): Promise<PostgratorResult> => {
        const result = await connection.query(query)
        return { rows: result.rows, fields: result.fields }
      },
      schemaTable: 'schemaversion'
    })

    await postgrator.migrate()

    console.log('Migration completed!')
  } catch (err) {
    console.error(err)
  } finally {
    await connection.end().catch(err => console.error(err))
  }
}

doMigration()
