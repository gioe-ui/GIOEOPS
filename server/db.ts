import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { evaluations, InsertEvaluation, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Evaluations ─────────────────────────────────────────────────────────────

export async function createEvaluation(data: InsertEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evaluations).values(data);
  return result;
}

export async function getEvaluations(filters?: { neop?: string; avaliador?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.neop) {
    conditions.push(like(evaluations.neop, `%${filters.neop}%`));
  }
  if (filters?.avaliador) {
    conditions.push(like(evaluations.avaliador, `%${filters.avaliador}%`));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(evaluations)
          .where(and(...conditions))
          .orderBy(desc(evaluations.createdAt))
      : await db.select().from(evaluations).orderBy(desc(evaluations.createdAt));

  return rows;
}

export async function deleteEvaluation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(evaluations).where(eq(evaluations.id, id));
}

export async function getStatistics(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  let all = await db.select().from(evaluations);
  
  if (startDate || endDate) {
    all = all.filter((e) => {
      const evalDate = new Date(e.createdAt);
      if (startDate && evalDate < startDate) return false;
      if (endDate && evalDate > endDate) return false;
      return true;
    });
  }
  
  const total = all.length;
  const avgScore = total > 0 ? all.reduce((s, e) => s + e.pontuacao, 0) / total : 0;

  const neop2 = all.filter((e) => e.neop === "2º NEOP").length;
  const neop3 = all.filter((e) => e.neop === "3º NEOP").length;
  const neop4 = all.filter((e) => e.neop === "4º NEOP").length;

  const score0_25 = all.filter((e) => e.pontuacao <= 25).length;
  const score26_50 = all.filter((e) => e.pontuacao >= 26 && e.pontuacao <= 50).length;
  const score51_75 = all.filter((e) => e.pontuacao >= 51 && e.pontuacao <= 75).length;
  const score76_100 = all.filter((e) => e.pontuacao >= 76).length;

  return { total, avgScore, neop2, neop3, neop4, score0_25, score26_50, score51_75, score76_100 };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}
