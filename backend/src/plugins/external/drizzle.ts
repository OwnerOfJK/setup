import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema/index.js'

declare module 'fastify' {
  export interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
    pgPool: Pool;
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    host: fastify.config.POSTGRES_HOST,
    port: Number(fastify.config.POSTGRES_PORT),
    user: fastify.config.POSTGRES_USER,
    password: fastify.config.POSTGRES_PASSWORD,
    database: fastify.config.POSTGRES_DATABASE,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  }
}

export default fp(async (fastify: FastifyInstance, opts) => {
  const pool = new Pool(opts)

  const db = drizzle(pool, {
    schema,
    logger: fastify.config.NODE_ENV === 'development'
  })

  fastify.decorate('db', db)
  fastify.decorate('pgPool', pool)

  fastify.addHook('onClose', async (instance) => {
    await instance.pgPool.end()
  })
}, { name: 'drizzle' })


