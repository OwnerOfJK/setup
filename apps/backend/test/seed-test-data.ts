import { eq } from 'drizzle-orm'
import { scryptHash } from '../src/plugins/app/password-manager.js'
import { schema } from '@setup/db'

export async function seedTestData(db: any) {
  // Create test roles
  const [adminRole] = await db.insert(schema.roles).values([
    { name: 'admin' },
    { name: 'user' }
  ]).returning()

  // Create test user with known credentials
  const hashedPassword = await scryptHash('Password123$')
  const [testUser] = await db.insert(schema.users).values({
    email: 'basic@example.com',
    username: 'basicuser',
    password: hashedPassword
  }).returning()

  // Assign user role to test user
  await db.insert(schema.userRoles).values({
    userId: testUser.id,
    roleId: adminRole.id
  })

  console.log('Test data seeded successfully')
  return { testUser, adminRole }
}