import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, getPendingApprovals, approveUser, rejectUser, upsertUser, getUserByOpenId } from "./db";

describe("User Approvals System", () => {
  const testOpenId = `test_approval_${Date.now()}`;
  const testEmail = `test-approval-${Date.now()}@gnr.pt`;

  beforeAll(async () => {
    // Create a test user with approved = 0
    await upsertUser({
      openId: testOpenId,
      email: testEmail,
      name: "Test User",
      loginMethod: "local",
      role: "user",
      approved: 0,
    });
  });

  afterAll(async () => {
    // Cleanup
    const db = await getDb();
    if (db) {
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  it("should list pending approvals", async () => {
    const pending = await getPendingApprovals();
    expect(Array.isArray(pending)).toBe(true);
    
    const testUser = pending.find((u) => u.email === testEmail);
    expect(testUser).toBeDefined();
    expect(testUser?.approved).toBe(0);
  });

  it("should approve a user", async () => {
    const user = await getUserByOpenId(testOpenId);
    expect(user).toBeDefined();
    
    if (user) {
      await approveUser(user.id);
      
      const updated = await getUserByOpenId(testOpenId);
      expect(updated?.approved).toBe(1);
    }
  });

  it("should not list approved users in pending", async () => {
    const pending = await getPendingApprovals();
    const testUser = pending.find((u) => u.email === testEmail);
    expect(testUser).toBeUndefined();
  });

  it("should reject a user", async () => {
    // Create another test user
    const rejectTestOpenId = `test_reject_${Date.now()}`;
    const rejectTestEmail = `test-reject-${Date.now()}@gnr.pt`;
    
    await upsertUser({
      openId: rejectTestOpenId,
      email: rejectTestEmail,
      name: "Test Reject User",
      loginMethod: "local",
      role: "user",
      approved: 0,
    });

    const user = await getUserByOpenId(rejectTestOpenId);
    expect(user).toBeDefined();

    if (user) {
      await rejectUser(user.id);
      
      const deleted = await getUserByOpenId(rejectTestOpenId);
      expect(deleted).toBeUndefined();
    }
  });
});
