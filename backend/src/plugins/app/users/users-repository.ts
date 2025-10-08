import { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import fp from 'fastify-plugin'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../../db/schema/index.js'
import { Auth } from '../../../schemas/auth.js'
import { users, roles as rolesTable, userRoles } from '../../../db/schema/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>;
  }
}

export function createUsersRepository (fastify: FastifyInstance) {
  const { db } = fastify

  return {
    async findByEmail (email: string, trx?: NodePgDatabase<typeof schema>) {
      const dbClient = trx ?? db

      const result = await dbClient
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      const user: (Omit<Auth, 'roles'> & { password: string }) | undefined = result[0]
      return user
    },

    async updatePassword (email: string, hashedPassword: string) {
      return db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email))
    },

    async findUserRolesByEmail (email: string, trx: NodePgDatabase<typeof schema>) {
      const result = await trx
        .select({
          name: rolesTable.name
        })
        .from(rolesTable)
        .innerJoin(userRoles, eq(rolesTable.id, userRoles.roleId))
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(eq(users.email, email))

      return result
    }
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    const repo = createUsersRepository(fastify)
    fastify.decorate('usersRepository', repo)
  },
  {
    name: 'users-repository',
    dependencies: ['drizzle']
  }
)
