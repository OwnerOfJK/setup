import { Client, ClientBase } from 'pg'

if (Number(process.env.CAN_DROP_DATABASE) !== 1) {
  throw new Error("You can't drop the database. Set `CAN_DROP_DATABASE=1` environment variable to allow this operation.")
}

async function dropDatabase () {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })
  await connection.connect()

  try {
    await dropDB(connection)
    console.log(`Database ${process.env.POSTGRES_DATABASE} has been dropped successfully.`)
  } catch (error) {
    console.error('Error dropping database:', error)
  } finally {
    await connection.end()
  }
}

async function dropDB (connection: ClientBase) {
  try {
    await connection.query(`DROP DATABASE "${process.env.POSTGRES_DATABASE}"`)
    console.log(`Database ${process.env.POSTGRES_DATABASE} dropped.`)
  } catch (error: any) {
    if (error.code === '3D000') {
      console.log(`Database ${process.env.POSTGRES_DATABASE} does not exist.`)
    } else {
      throw error
    }
  }
}

dropDatabase()
