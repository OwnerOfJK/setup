import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { schema } from '@setup/db'

declare module 'fastify' {
  export interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
    pgPool: Pool;
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  // Fallback to environment variables if config isn't available yet
  const config = fastify.config || {}
  return {
    host: config.POSTGRES_HOST || process.env.POSTGRES_HOST,
    port: Number(config.POSTGRES_PORT || process.env.POSTGRES_PORT),
    user: config.POSTGRES_USER || process.env.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: config.POSTGRES_DATABASE || process.env.POSTGRES_DATABASE,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  }
}

export default fp(async (fastify: FastifyInstance, opts) => {
  // Use real database connection for all environments including test
  // Tests will use testcontainers to provide isolated database instances

  // Real database connection for non-test environments
  const pool = new Pool(opts)

  const config = fastify.config || {}
  const db = drizzle(pool, {
    schema,
    logger: (config.NODE_ENV || process.env.NODE_ENV) === 'development'
  })

  fastify.decorate('db', db)
  fastify.decorate('pgPool', pool)

  fastify.addHook('onClose', async (instance) => {
    await instance.pgPool.end()
  })
}, { name: 'drizzle' })


