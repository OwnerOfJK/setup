import { pgTable, serial, integer } from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { roles } from './roles.js'

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' })
})
