import fp from 'fastify-plugin'
import { encrypt } from '@setup/utils'

const passwordManager = {
  hash: encrypt.scryptHash,
  compare: encrypt.compare
}

declare module 'fastify' {
  export interface FastifyInstance {
    passwordManager: typeof passwordManager
  }
}

export default fp(async (fastify) => {
  fastify.decorate('passwordManager', passwordManager)
}, {
  name: 'password-manager'
})
