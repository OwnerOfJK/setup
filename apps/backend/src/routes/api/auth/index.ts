import {
  FastifyPluginAsyncTypebox,
  Type
} from '@fastify/type-provider-typebox'
import { CredentialsSchema } from '../../../schemas/auth.js'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { schema } from '@setup/db'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository, passwordManager } = fastify
  fastify.post(
    '/login',
    {
      schema: {
        body: CredentialsSchema,
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            message: Type.Optional(Type.String())
          }),
          401: Type.Object({
            message: Type.String()
          })
        },
        tags: ['Authentication']
      }
    },
    async function (request, reply) {
      const { email, password } = request.body

      return fastify.db.transaction(async (trx: NodePgDatabase<typeof schema>) => {
        const user = await usersRepository.findByEmail(email, trx)

        if (user) {
          const isPasswordValid = await passwordManager.compare(
            password,
            user.password
          )
          if (isPasswordValid) {
            const roles = await usersRepository.findUserRolesByEmail(email, trx)

            request.session.user = {
              id: user.id,
              email: user.email,
              username: user.username,
              roles: roles.map((role: { name: string }) => role.name)
            }

            await request.session.save()

            return { success: true }
          }
        }

        reply.status(401)

        return { message: 'Invalid email or password.' }
      })
    }
  )
}

export default plugin
