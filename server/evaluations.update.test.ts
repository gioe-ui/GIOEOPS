import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, createEvaluation, getEvaluationById } from "./db";
import { evaluations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Evaluation Update and Audit Tracking", () => {
  let testEvaluationId: number;

  beforeAll(async () => {
    // Create a test evaluation
    const result = await createEvaluation({
      userId: 1,
      nuipc: "TEST-UPDATE-001",
      entidadeSolicitadora: "Test Entity",
      tipoCriminal: "trafico",
      pontuacao: 50,
      neop: "3º NEOP",
    });
    // Get the ID from the result - it could be an evaluation object or have insertId
    testEvaluationId = (result as any).id || ((result as any).insertId ? Number((result as any).insertId) : undefined);
    if (!testEvaluationId) throw new Error("Failed to create test evaluation");
  });

  afterAll(async () => {
    // Clean up
    const db = await getDb();
    if (db && testEvaluationId) {
      await db.delete(evaluations).where(eq(evaluations.id, testEvaluationId));
    }
  });

  it("should retrieve evaluation by ID", async () => {
    const evaluation = await getEvaluationById(testEvaluationId);
    expect(evaluation).toBeDefined();
    expect(evaluation?.id).toBe(testEvaluationId);
    expect(evaluation?.nuipc).toBe("TEST-UPDATE-001");
  });

  it("should have createdAt timestamp", async () => {
    const evaluation = await getEvaluationById(testEvaluationId);
    expect(evaluation?.createdAt).toBeDefined();
    expect(evaluation?.createdAt instanceof Date).toBe(true);
  });

  it("should have updatedAt field", async () => {
    const evaluation = await getEvaluationById(testEvaluationId);
    expect(evaluation?.updatedAt).toBeDefined();
  });

  it("should have updatedBy field for audit tracking", async () => {
    const evaluation = await getEvaluationById(testEvaluationId);
    // updatedBy may be null initially, but should exist as a field
    expect("updatedBy" in evaluation!).toBe(true);
  });

  it("should update evaluation with new data", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const updatedBy = "Test User (2º NEOP)";
    
    await db
      .update(evaluations)
      .set({
        tipoCriminal: "homicidio",
        pontuacao: 85,
        neop: "4º NEOP",
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, testEvaluationId));

    const updated = await getEvaluationById(testEvaluationId);
    expect(updated?.tipoCriminal).toBe("homicidio");
    expect(updated?.pontuacao).toBe(85);
    expect(updated?.neop).toBe("4º NEOP");
    expect(updated?.updatedBy).toBe(updatedBy);
  });

  it("should preserve userId when updating", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const original = await getEvaluationById(testEvaluationId);
    const originalUserId = original?.userId;

    await db
      .update(evaluations)
      .set({
        parecer: "Updated parecer",
        updatedBy: "Another User (3º NEOP)",
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, testEvaluationId));

    const updated = await getEvaluationById(testEvaluationId);
    expect(updated?.userId).toBe(originalUserId);
    expect(updated?.updatedBy).toBe("Another User (3º NEOP)");
  });

  it("should track multiple updates with different users", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // First update
    await db
      .update(evaluations)
      .set({
        parecer: "First update",
        updatedBy: "User A (2º NEOP)",
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, testEvaluationId));

    let evaluation = await getEvaluationById(testEvaluationId);
    expect(evaluation?.updatedBy).toBe("User A (2º NEOP)");

    // Second update
    await db
      .update(evaluations)
      .set({
        parecer: "Second update",
        updatedBy: "User B (3º NEOP)",
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, testEvaluationId));

    evaluation = await getEvaluationById(testEvaluationId);
    expect(evaluation?.updatedBy).toBe("User B (3º NEOP)");
    expect(evaluation?.parecer).toBe("Second update");
  });

  it("should handle NEOP manual override", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Update with manual NEOP
    await db
      .update(evaluations)
      .set({
        neop: "2º NEOP", // Manual override
        updatedBy: "Admin User (Admin)",
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, testEvaluationId));

    const updated = await getEvaluationById(testEvaluationId);
    expect(updated?.neop).toBe("2º NEOP");
    expect(updated?.updatedBy).toBe("Admin User (Admin)");
  });
});
