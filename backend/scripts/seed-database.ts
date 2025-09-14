import { Client } from 'pg'
import { scryptHash } from '../src/plugins/app/password-manager.js'

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error("You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation.")
}

async function seed () {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })
  await connection.connect()

  try {
    await truncateTables(connection)
    await seedUsers(connection)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await connection.end()
  }
}

async function truncateTables (connection: Client) {
  const { rows: tables }: any = await connection.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `)

  if (tables.length > 0) {
    const tableNames = tables.map((row: { table_name: string }) => row.table_name)
    const truncateQueries = tableNames
      .map((tableName: string) => `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`)
      .join('; ')

    await connection.query(truncateQueries)
    console.log('All tables have been truncated successfully.')
  }
}

async function seedUsers (connection: Client) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ]
  const hash = await scryptHash('Password123$')

  // The goal here is to create a role hierarchy
  // E.g. an admin should have all the roles
  const rolesAccumulator: number[] = []

  for (const user of users) {
    const [userResult] = await connection.execute(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `, [user.username, user.email, hash])

    const userId = (userResult as any).rows[0].id

    const [roleResult] = await connection.execute(`
      INSERT INTO roles (name)
      VALUES (?)
    `, [user.username])

    const newRoleId = (roleResult as any).rows[0].id

    rolesAccumulator.push(newRoleId)

    for (const roleId of rolesAccumulator) {
      await connection.execute(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (?, ?)
      `, [userId, roleId])
    }
  }

  console.log('Users have been seeded successfully.')
}

seed()
