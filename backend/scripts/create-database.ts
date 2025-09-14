import { Client, ClientBase } from 'pg'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error("You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation.")
}

async function createDatabase () {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })
  await connection.connect()

  try {
    await createDB(connection)
    console.log(`Database ${process.env.POSTGRES_DATABASE} has been created successfully.`)
  } catch (error) {
    console.error('Error creating database:', error)
  } finally {
    await connection.end()
  }
}

async function createDB (connection: ClientBase) {
  try {
    await connection.query(`CREATE DATABASE "${process.env.POSTGRES_DATABASE}"`)
    console.log(`Database ${process.env.POSTGRES_DATABASE} created successfully.`)
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log(`Database ${process.env.POSTGRES_DATABASE} already exists.`)
    } else {
      throw error
    }
  }
}

createDatabase()
