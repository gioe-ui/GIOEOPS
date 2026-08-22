import { and, desc, eq, gte, like, lte, inArray, or, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { evaluations, InsertEvaluation, InsertUser, users, operations, InsertOperation, notifications, suspects, InsertSuspect, Suspect } from "../drizzle/schema";
import { ENV } from "./_core/env";

// A Postgres "Notification" row shape (not exported from schema.ts, so we infer it locally).
type Notification = typeof notifications.$inferSelect;

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
          try {
                  // prepare: false is required when connecting through Supabase's Transaction
            // pooler (pgbouncer); it is also safe to use against a direct connection.
            const client = postgres(process.env.DATABASE_URL, { prepare: false });
                  _db = drizzle(client);
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
        if (!values.lastSignedIn) values.lastSignedIn = new Date().toISOString();
        if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date().toISOString();
        // Postgres has no "ON UPDATE CURRENT_TIMESTAMP" column behaviour like MySQL,
      // so updatedAt is refreshed explicitly here instead.
      updateSet.updatedAt = new Date().toISOString();

      await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
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
    const [inserted] = await db.insert(evaluations).values(data).returning();
    return inserted ?? null;
}

export async function getEvaluations(filters?: { neop?: string; avaliador?: string; cterRequerente?: string; userId?: number }) {
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
    if (filters?.userId) {
          conditions.push(eq(evaluations.userId, filters.userId));
    }

  const rows =
        conditions.length > 0
        ? await db
              .select({
                            id: evaluations.id,
                            userId: evaluations.userId,
                            nuipc: evaluations.nuipc,
                            entidadeSolicitadora: evaluations.entidadeSolicitadora,
                            pocPosto: evaluations.pocPosto,
                            pocNome: evaluations.pocNome,
                            pocContacto: evaluations.pocContacto,
                            despacho: evaluations.despacho,
                            mandadoDetencao: evaluations.mandadoDetencao,
                            mandadoBusca: evaluations.mandadoBusca,
                            quantidadeSuspeitos: evaluations.quantidadeSuspeitos,
                            modalidadeIsolado: evaluations.modalidadeIsolado,
                            modalidadeAssociacao: evaluations.modalidadeAssociacao,
                            tipoCriminal: evaluations.tipoCriminal,
                            antecedentesContraPessoas: evaluations.antecedentesContraPessoas,
                            antecedentesContraPatrimonio: evaluations.antecedentesContraPatrimonio,
                            antecedentesOutros: evaluations.antecedentesOutros,
                            antecedentesFss: evaluations.antecedentesFss,
                            posseArma: evaluations.posseArma,
                            usoArma: evaluations.usoArma,
                            tipologiaApartamento: evaluations.tipologiaApartamento,
                            tipologiaMoradia: evaluations.tipologiaMoradia,
                            tipologiaOutro: evaluations.tipologiaOutro,
                            contextoIsolado: evaluations.contextoIsolado,
                            contextoBairroSocial: evaluations.contextoBairroSocial,
                            contextoMeioUrbano: evaluations.contextoMeioUrbano,
                            contextoMeioRural: evaluations.contextoMeioRural,
                            segurancaCaes: evaluations.segurancaCaes,
                            segurancaPortaBlindada: evaluations.segurancaPortaBlindada,
                            segurancaOutrasMedidas: evaluations.segurancaOutrasMedidas,
                            avaliador: evaluations.avaliador,
                            dataAvaliacao: evaluations.dataAvaliacao,
                            parecer: evaluations.parecer,
                            pontuacao: evaluations.pontuacao,
                            neop: evaluations.neop,
                            createdAt: evaluations.createdAt,
                            assignedUserId: operations.assignedUserId,
                            assignedUserName: users.name,
                            assignedUserRank: users.rank,
                            assignedUserPhone: users.phoneNumber,
                            scheduledDate: operations.scheduledDate,
                            operationId: operations.id,
                            operacaoPreenchida: operations.operacaoPreenchida,
                            consumosPreenchidos: operations.consumosPreenchidos,
                            observacoesPreenchidas: operations.observacoesPreenchidas,
              })
              .from(evaluations)
              .leftJoin(operations, eq(evaluations.id, operations.evaluationId))
              .leftJoin(users, eq(operations.assignedUserId, users.id))
              .where(and(...conditions))
              .orderBy(desc(evaluations.createdAt))
          : await db
            .select({
                          id: evaluations.id,
                          userId: evaluations.userId,
                          nuipc: evaluations.nuipc,
                          entidadeSolicitadora: evaluations.entidadeSolicitadora,
                          pocPosto: evaluations.pocPosto,
                          pocNome: evaluations.pocNome,
                          pocContacto: evaluations.pocContacto,
                          despacho: evaluations.despacho,
                          mandadoDetencao: evaluations.mandadoDetencao,
                          mandadoBusca: evaluations.mandadoBusca,
                          quantidadeSuspeitos: evaluations.quantidadeSuspeitos,
                          modalidadeIsolado: evaluations.modalidadeIsolado,
                          modalidadeAssociacao: evaluations.modalidadeAssociacao,
                          tipoCriminal: evaluations.tipoCriminal,
                          antecedentesContraPessoas: evaluations.antecedentesContraPessoas,
                          antecedentesContraPatrimonio: evaluations.antecedentesContraPatrimonio,
                          antecedentesOutros: evaluations.antecedentesOutros,
                          antecedentesFss: evaluations.antecedentesFss,
                          posseArma: evaluations.posseArma,
                          usoArma: evaluations.usoArma,
                          tipologiaApartamento: evaluations.tipologiaApartamento,
                          tipologiaMoradia: evaluations.tipologiaMoradia,
                          tipologiaOutro: evaluations.tipologiaOutro,
                          contextoIsolado: evaluations.contextoIsolado,
                          contextoBairroSocial: evaluations.contextoBairroSocial,
                          contextoMeioUrbano: evaluations.contextoMeioUrbano,
                          contextoMeioRural: evaluations.contextoMeioRural,
                          segurancaCaes: evaluations.segurancaCaes,
                          segurancaPortaBlindada: evaluations.segurancaPortaBlindada,
                          segurancaOutrasMedidas: evaluations.segurancaOutrasMedidas,
                          avaliador: evaluations.avaliador,
                          dataAvaliacao: evaluations.dataAvaliacao,
                          parecer: evaluations.parecer,
                          pontuacao: evaluations.pontuacao,
                          neop: evaluations.neop,
                          createdAt: evaluations.createdAt,
                          assignedUserId: operations.assignedUserId,
                          assignedUserName: users.name,
                          assignedUserRank: users.rank,
                          assignedUserPhone: users.phoneNumber,
                          scheduledDate: operations.scheduledDate,
                          operationId: operations.id,
                          operacaoPreenchida: operations.operacaoPreenchida,
                          consumosPreenchidos: operations.consumosPreenchidos,
                          observacoesPreenchidas: operations.observacoesPreenchidas,
            })
            .from(evaluations)
            .leftJoin(operations, eq(evaluations.id, operations.evaluationId))
            .leftJoin(users, eq(operations.assignedUserId, users.id))
            .orderBy(desc(evaluations.createdAt));

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
    const [inserted] = await db.insert(operations).values(data).returning();
    return inserted ?? null;
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

  const [inserted] = await db.insert(notifications).values(data).returning();
    return inserted;
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
      .set({ sent: 1, sentAt: new Date().toISOString() })
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

  // Sinalizar operacoes que tem militar atribuido mas ainda nao foram preenchidas
  const incompleteOps = await db.select()
      .from(operations)
      .where(
              and(
                        // Tem militar atribuido
                isNotNull(operations.assignedUserId),
                        // Ainda nao foi sinalizada
                        eq(operations.flaggedForCompletion, 0),
                        // Pelo menos um campo nao foi preenchido
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
                    flaggedAt: new Date().toISOString(),
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

// ─── Suspects ────────────────────────────────────────────────────────────────

export async function createSuspect(data: InsertSuspect): Promise<Suspect | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

  // Build insert data with only non-null/non-undefined values
  const insertData: any = {
        evaluationId: data.evaluationId,
  };

  // Only add fields that have actual values
  if (data.nome !== undefined && data.nome !== null) insertData.nome = data.nome;
    if (data.dataNascimento !== undefined && data.dataNascimento !== null) insertData.dataNascimento = data.dataNascimento;
    if (data.nacionalidade !== undefined && data.nacionalidade !== null) insertData.nacionalidade = data.nacionalidade;
    if (data.nif !== undefined && data.nif !== null) insertData.nif = data.nif;
    if (data.cc !== undefined && data.cc !== null) insertData.cc = data.cc;
    if (data.morada !== undefined && data.morada !== null) insertData.morada = data.morada;
    if (data.observacoes !== undefined && data.observacoes !== null) insertData.observacoes = data.observacoes;

  const [inserted] = await db.insert(suspects).values(insertData).returning();
    return inserted ?? null;
}

export async function getSuspectById(id: number): Promise<Suspect | null> {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(suspects).where(eq(suspects.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
}

export async function getSuspectsByEvaluationId(evaluationId: number): Promise<Suspect[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(suspects).where(eq(suspects.evaluationId, evaluationId));
}

export async function updateSuspect(id: number, data: Partial<InsertSuspect>): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(suspects).set(data).where(eq(suspects.id, id));
}

export async function deleteSuspect(id: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(suspects).where(eq(suspects.id, id));
}

export async function deleteSuspectsByEvaluationId(evaluationId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(suspects).where(eq(suspects.evaluationId, evaluationId));
}

// ============ Suspect Profiles ============

export async function getSuspectProfiles(filters?: {
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<Array<{
    id: number;
    nome: string | null;
    dataNascimento: string | null;
    nacionalidade: string | null;
    nif: string | null;
    cc: string | null;
    totalOperations: number;
    averageNeop: number;
    crimeTypes: string[];
    lastOperationDate: string | null;
}>> {
    const db = await getDb();
    if (!db) return [];

  try {
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;
        const searchTerm = filters?.search ? `%${filters.search}%` : null;

      // Get unique suspects with operation count and stats
      const query = db.select({
              id: suspects.id,
              nome: suspects.nome,
              dataNascimento: suspects.dataNascimento,
              nacionalidade: suspects.nacionalidade,
              nif: suspects.nif,
              cc: suspects.cc,
      })
          .from(suspects)
          .limit(limit)
          .offset(offset);

      const suspectsList = await query;

      // Enrich with operation data
      const enriched = await Promise.all(suspectsList.map(async (suspect) => {
              const operationsData = await db.select({
                        neop: evaluations.neop,
                        tipoCriminal: evaluations.tipoCriminal,
                        dataAvaliacao: evaluations.dataAvaliacao,
              })
                .from(evaluations)
                .innerJoin(suspects, eq(suspects.evaluationId, evaluations.id))
                .where(eq(suspects.id, suspect.id));

                                                                const neops = operationsData.map(op => {
                                                                          if (op.neop === '4º NEOP') return 4;
                                                                          if (op.neop === '3º NEOP') return 3;
                                                                          if (op.neop === '2º NEOP') return 2;
                                                                          return 1;
                                                                });

                                                                const crimeTypes = operationsData
                .map(op => op.tipoCriminal)
                .filter(Boolean)
                .flatMap(t => t?.split(',') || [])
                .map(t => t.trim())
                .filter((v, i, a) => a.indexOf(v) === i);

                                                                const dates = operationsData
                .map(op => op.dataAvaliacao)
                .filter(Boolean)
                .sort()
                .reverse();

                                                                return {
                                                                          ...suspect,
                                                                          totalOperations: operationsData.length,
                                                                          averageNeop: neops.length > 0 ? neops.reduce((a, b) => a + b, 0) / neops.length : 0,
                                                                          crimeTypes,
                                                                          lastOperationDate: dates[0] || null,
                                                                };
      }));

      return enriched;
  } catch (error) {
        console.error("[Database] Failed to get suspect profiles:", error);
        return [];
  }
}

export async function getSuspectProfile(suspectId: number): Promise<{
    suspect: Suspect | null;
    operations: Array<{
      id: number;
      evaluationId: number;
      pontuacao: number;
      neop: string;
      dataAvaliacao: string | null;
      tipoCriminal: string | null;
      cterRequerente: string | null;
    }>;
    statistics: {
      totalOperations: number;
      averageScore: number;
      mostFrequentCrime: string | null;
      neop4Count: number;
    };
} | null> {
    const db = await getDb();
    if (!db) return null;

  try {
        const suspect = await db.select()
          .from(suspects)
          .where(eq(suspects.id, suspectId))
          .limit(1)
          .then(rows => rows[0] || null);

      if (!suspect) return null;

      const operationsData = await db.select({
              id: evaluations.id,
              evaluationId: evaluations.id,
              pontuacao: evaluations.pontuacao,
              neop: evaluations.neop,
              dataAvaliacao: evaluations.dataAvaliacao,
              tipoCriminal: evaluations.tipoCriminal,
              cterRequerente: evaluations.cterRequerente,
      })
          .from(evaluations)
          .where(eq(evaluations.id, suspect.evaluationId));

      const totalOps = operationsData.length;
        const avgScore = totalOps > 0
          ? operationsData.reduce((sum, op) => sum + op.pontuacao, 0) / totalOps
                : 0;

      const crimeTypes = operationsData
          .map(op => op.tipoCriminal)
          .filter(Boolean)
          .flatMap(t => t?.split(',') || [])
          .map(t => t.trim());

      const crimeFreq = crimeTypes.reduce((acc, crime) => {
              acc[crime] = (acc[crime] || 0) + 1;
              return acc;
      }, {} as Record<string, number>);

      const mostFrequentCrime = Object.entries(crimeFreq)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      const neop4Count = operationsData.filter(op => op.neop === '4º NEOP').length;

      return {
              suspect,
              operations: operationsData,
              statistics: {
                        totalOperations: totalOps,
                        averageScore: Math.round(avgScore * 100) / 100,
                        mostFrequentCrime,
                        neop4Count,
              },
      };
  } catch (error) {
        console.error("[Database] Failed to get suspect by ID:", error);
        return null;
  }
}

// ============ Operation Analysis ============

export async function getOperationAnalysis(filters?: {
    startDate?: string;
    endDate?: string;
    neop?: string;
    cterRequerente?: string;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    offset?: number;
}): Promise<Array<{
    id: number;
    nuipc: string | null;
    pontuacao: number;
    neop: string;
    dataAvaliacao: string | null;
    cterRequerente: string | null;
    tipoCriminal: string | null;
    suspectCount: number;
    operationStatus: string;
}>> {
    const db = await getDb();
    if (!db) return [];

  try {
        const limit = filters?.limit || 50;
        const offset = filters?.offset || 0;

      let query = db.select({
              id: evaluations.id,
              nuipc: evaluations.nuipc,
              pontuacao: evaluations.pontuacao,
              neop: evaluations.neop,
              dataAvaliacao: evaluations.dataAvaliacao,
              cterRequerente: evaluations.cterRequerente,
              tipoCriminal: evaluations.tipoCriminal,
      })
          .from(evaluations);

      const conditions = [];

      if (filters?.startDate) {
              conditions.push(gte(evaluations.dataAvaliacao, filters.startDate));
      }
        if (filters?.endDate) {
                conditions.push(lte(evaluations.dataAvaliacao, filters.endDate));
        }
        if (filters?.neop) {
                conditions.push(eq(evaluations.neop, filters.neop));
        }
        if (filters?.cterRequerente) {
                conditions.push(eq(evaluations.cterRequerente, filters.cterRequerente));
        }
        if (filters?.minScore !== undefined) {
                conditions.push(gte(evaluations.pontuacao, filters.minScore));
        }
        if (filters?.maxScore !== undefined) {
                conditions.push(lte(evaluations.pontuacao, filters.maxScore));
        }

      if (conditions.length > 0) {
              query = query.where(and(...conditions)) as typeof query;
      }

      const results = await query.limit(limit).offset(offset);

      // Enrich with suspect count and operation status
      const enriched = await Promise.all(results.map(async (evaluation) => {
              const suspectCount = await db.select({ count: sql`COUNT(*)` })
                .from(suspects)
                .where(eq(suspects.evaluationId, evaluation.id))
                .then(rows => Number(rows[0]?.count ?? 0));

                                                           const operation = await db.select()
                .from(operations)
                .where(eq(operations.evaluationId, evaluation.id))
                .limit(1)
                .then(rows => rows[0] || null);

                                                           const operationStatus = operation
                ? operation.operacaoPreenchida ? 'Completa' : 'Incompleta'
                                                                     : 'Sem Operação';

                                                           return {
                                                                     ...evaluation,
                                                                     suspectCount,
                                                                     operationStatus,
                                                           };
      }));

      return enriched;
  } catch (error) {
        console.error("[Database] Failed to get operation analysis:", error);
        return [];
  }
}

export async function getOperationComparisonStats(): Promise<{
    totalOperations: number;
    byNeop: Record<string, number>;
    byCter: Record<string, number>;
    averageScore: number;
    neop4Percentage: number;
}> {
    const db = await getDb();
    if (!db) return {
          totalOperations: 0,
          byNeop: {},
          byCter: {},
          averageScore: 0,
          neop4Percentage: 0,
    };

  try {
        const allEvals = await db.select().from(evaluations);

      const byNeop: Record<string, number> = {};
        const byCter: Record<string, number> = {};
        let totalScore = 0;
        let neop4Count = 0;

      allEvals.forEach(evaluation => {
              byNeop[evaluation.neop] = (byNeop[evaluation.neop] || 0) + 1;
              if (evaluation.cterRequerente) {
                        byCter[evaluation.cterRequerente] = (byCter[evaluation.cterRequerente] || 0) + 1;
              }
              totalScore += evaluation.pontuacao;
              if (evaluation.neop === '4º NEOP') neop4Count++;
      });

      return {
              totalOperations: allEvals.length,
              byNeop,
              byCter,
              averageScore: allEvals.length > 0 ? Math.round((totalScore / allEvals.length) * 100) / 100 : 0,
              neop4Percentage: allEvals.length > 0 ? Math.round((neop4Count / allEvals.length) * 100) : 0,
      };
  } catch (error) {
        console.error("[Database] Failed to get operation comparison stats:", error);
        return {
                totalOperations: 0,
                byNeop: {},
                byCter: {},
                averageScore: 0,
                neop4Percentage: 0,
        };
  }
}
