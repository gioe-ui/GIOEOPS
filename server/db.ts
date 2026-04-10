import { and, desc, eq, gte, like, lte, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { evaluations, InsertEvaluation, InsertUser, users, operations, InsertOperation, notifications, Notification } from "../drizzle/schema";
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
    if (user.approved !== undefined) {
      values.approved = user.approved;
      updateSet.approved = user.approved;
    } else if (user.role === "admin") {
      // Admins são sempre aprovados
      values.approved = 1;
      updateSet.approved = 1;
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

export async function getEvaluations(filters?: { neop?: string; avaliador?: string; cterRequerente?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.neop) {
    conditions.push(like(evaluations.neop, `%${filters.neop}%`));
  }
  if (filters?.avaliador) {
    conditions.push(like(evaluations.avaliador, `%${filters.avaliador}%`));
  }
  if (filters?.cterRequerente) {
    conditions.push(like(evaluations.parecer, `%${filters.cterRequerente}%`));
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

export async function getEvaluationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(evaluations).where(eq(evaluations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUniqueCters() {
  const db = await getDb();
  if (!db) return [];

  const all = await db.select().from(evaluations);
  const cters = new Set<string>();
  
  all.forEach((e) => {
    if (e.parecer) {
      const match = e.parecer.match(/CTer:\s*([^\n,]+)/i);
      if (match) {
        const cter = match[1].trim();
        if (cter) cters.add(cter);
      }
    }
  });
  
  return Array.from(cters).sort();
}

export async function deleteEvaluation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Eliminar operações associadas primeiro (cascata)
  await db.delete(operations).where(eq(operations.evaluationId, id));
  // Depois eliminar a avaliação
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


export async function getPendingApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.approved, 0)).orderBy(desc(users.createdAt));
}

export async function approveUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ approved: 1 }).where(eq(users.id, id));
}

export async function rejectUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function getNeop4ByCter(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return {};

  let all = await db.select().from(evaluations);
  
  if (startDate || endDate) {
    all = all.filter((e) => {
      const evalDate = new Date(e.createdAt);
      if (startDate && evalDate < startDate) return false;
      if (endDate && evalDate > endDate) return false;
      return true;
    });
  }
  
  // Filtrar apenas 4º NEOP
  const neop4Evaluations = all.filter((e) => e.neop === "4º NEOP");
  
  // Agrupar por CTer (extrair do parecer que contém [CT ...])
  const cterCounts: Record<string, number> = {};
  neop4Evaluations.forEach((e) => {
    if (e.parecer) {
      // Procurar por padrão [CT ...]
      const match = e.parecer.match(/\[([^\]]+)\]/);
      if (match) {
        const cterName = match[1].trim();
        cterCounts[cterName] = (cterCounts[cterName] || 0) + 1;
      }
    }
  });
  
  return cterCounts;
}

// ─── Operations ──────────────────────────────────────────────────────────────

export async function createOperation(data: InsertOperation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(operations).values(data);
  return result;
}

export async function getOperationByEvaluationId(evaluationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(operations).where(eq(operations.evaluationId, evaluationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOperationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(operations).where(eq(operations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateOperation(id: number, data: Partial<InsertOperation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(operations).set(data).where(eq(operations.id, id));
}


export async function getOperationsByMonth(month?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (month) {
    const result = await db.select().from(operations).where(eq(operations.preenchimentoSecOp, month));
    return result;
  }
  
  const result = await db.select().from(operations);
  return result;
}

export async function getOperationMonths() {
  const db = await getDb();
  if (!db) return [];
  
  const all = await db.select().from(operations);
  const months = new Set<string>();
  all.forEach(op => {
    if (op.preenchimentoSecOp) {
      months.add(op.preenchimentoSecOp);
    }
  });
  return Array.from(months).sort();
}


export async function deleteOperations(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return;
  
  await db.delete(operations).where(inArray(operations.id, ids));
}

export async function createNotification(data: {
  operationId: number;
  userId: number;
  phoneNumber: string;
  message: string;
  whatsappLink: string;
}): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  const id = (result as any).insertId;
  
  const notification = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return notification[0];
}

export async function getNotificationsByOperation(operationId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(notifications).where(eq(notifications.operationId, operationId));
}

export async function markNotificationAsSent(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(notifications)
    .set({ sent: 1, sentAt: new Date() })
    .where(eq(notifications.id, notificationId));
}


export async function updateOperationStatus(operationId: number, data: {
  operacaoPreenchida?: number;
  consumosPreenchidos?: number;
  observacoesPreenchidas?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, any> = {};
  if (data.operacaoPreenchida !== undefined) updateData.operacaoPreenchida = data.operacaoPreenchida;
  if (data.consumosPreenchidos !== undefined) updateData.consumosPreenchidos = data.consumosPreenchidos;
  if (data.observacoesPreenchidas !== undefined) updateData.observacoesPreenchidas = data.observacoesPreenchidas;
  
  if (Object.keys(updateData).length === 0) return;
  
  await db.update(operations)
    .set(updateData)
    .where(eq(operations.id, operationId));
}

export async function flagIncompleteOperations(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  
  const incompleteOps = await db.select()
    .from(operations)
    .where(
      and(
        eq(operations.assignedUserId, operations.assignedUserId),
        lte(operations.scheduledDate, twoDaysAgo.toISOString().split('T')[0]),
        eq(operations.flaggedForCompletion, 0),
        or(
          eq(operations.operacaoPreenchida, 0),
          eq(operations.consumosPreenchidos, 0),
          eq(operations.observacoesPreenchidas, 0)
        )
      )
    );
  
  for (const op of incompleteOps) {
    await db.update(operations)
      .set({
        flaggedForCompletion: 1,
        flaggedAt: new Date(),
      })
      .where(eq(operations.id, op.id));
  }
  
  return incompleteOps.length;
}

export async function getFlaggedOperations(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(operations)
    .where(eq(operations.flaggedForCompletion, 1));
}

export async function getOperationWithAssignedUser(operationId: number): Promise<any> {
  const db = await getDb();
  if (!db) return null;
  
  const op = await db.select()
    .from(operations)
    .where(eq(operations.id, operationId))
    .limit(1);
  
  if (!op || !op[0] || !op[0].assignedUserId) return null;
  
  const user = await db.select()
    .from(users)
    .where(eq(users.id, op[0].assignedUserId))
    .limit(1);
  
  return { operation: op[0], user: user?.[0] };
}
