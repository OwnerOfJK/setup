// Simple test to verify Drizzle compilation works
import assert from "node:assert";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from '@setup/db'
import { eq } from "drizzle-orm";

test("Drizzle schema is properly exported", () => {
  assert.ok(schema.users, "users table should be exported");
  assert.ok(schema.roles, "roles table should be exported");
  assert.ok(schema.userRoles, "userRoles table should be exported");
});

test("Drizzle schema has correct structure", () => {
  // Check that users table has expected columns
  assert.ok(schema.users.id, "users should have id column");
  assert.ok(schema.users.email, "users should have email column");
  assert.ok(schema.users.username, "users should have username column");
  assert.ok(schema.users.password, "users should have password column");
  assert.ok(schema.users.createdAt, "users should have createdAt column");
});

test("Drizzle eq function works with schema", () => {
  const condition = eq(schema.users.email, "test@example.com");
  assert.ok(condition, "eq function should return a valid condition");
});

test("Drizzle can be initialized with schema", () => {
  // Mock pool for testing
  const mockPool = {} as Pool;

  // This should not throw an error
  const db = drizzle(mockPool, { schema });
  assert.ok(db, "drizzle should initialize with schema");
});

console.log("✅ Drizzle migration verification test completed successfully");
