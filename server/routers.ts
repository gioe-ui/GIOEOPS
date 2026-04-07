import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./auth";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createEvaluation,
  deleteEvaluation,
  deleteUser,
  getAllUsers,
  getEvaluations,
  getEvaluationById,
  getUniqueCters,
  getStatistics,
  getDb,
  getNeop4ByCter,
  getPendingApprovals,
  approveUser,
  rejectUser,
} from "./db";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Scoring helper ───────────────────────────────────────────────────────────
const TIPO_SCORES: Record<string, number> = {
  trafico: 7,
  assalto: 6,
  homicidio: 10,
  sequestro: 9,
  violencia: 8,
  outro: 4,
};
const POSSE_SCORES: Record<string, number> = { registada: 8, provavel: 6, improvavel: 2 };
const USO_SCORES: Record<string, number> = { haRegisto: 10, naoHaRegisto: 3 };
const QTD_SCORES: Record<string, number> = { "1": 1, "2": 2, "3": 4, "4+": 6 };

function calcScore(d: {
  mandadoDetencao?: number | null;
  mandadoBusca?: number | null;
  quantidadeSuspeitos?: string | null;
  modalidadeIsolado?: number | null;
  modalidadeAssociacao?: number | null;
  tipoCriminal?: string | null;
  antecedentesContraPessoas?: number | null;
  antecedentesContraPatrimonio?: number | null;
  antecedentesOutros?: number | null;
  antecedentesFSS?: string | null;
  posseArma?: string | null;
  usoArma?: string | null;
  tipologiaApartamento?: number | null;
  tipologiaMoradia?: number | null;
  tipologiaOutro?: number | null;
  contextoIsolado?: number | null;
  contextoBairroSocial?: number | null;
  contextoMeioUrbano?: number | null;
  contextoMeioRural?: number | null;
  segurancaCaes?: number | null;
  segurancaPortaBlindada?: number | null;
  segurancaOutrasMedidas?: number | null;
}): { pontuacao: number; neop: string } {
  let s = 0;
  if (d.mandadoDetencao) s += 5;
  if (d.mandadoBusca) s += 3;
  s += QTD_SCORES[d.quantidadeSuspeitos ?? "1"] ?? 1;
  if (d.modalidadeIsolado) s += 2;
  if (d.modalidadeAssociacao) s += 8;
  s += TIPO_SCORES[d.tipoCriminal ?? "outro"] ?? 4;
  if (d.antecedentesContraPessoas) s += 8;
  if (d.antecedentesContraPatrimonio) s += 5;
  if (d.antecedentesOutros) s += 3;
  if (d.antecedentesFSS === "sim") s += 9;
  s += POSSE_SCORES[d.posseArma ?? "improvavel"] ?? 2;
  s += USO_SCORES[d.usoArma ?? "naoHaRegisto"] ?? 3;

  // Tipologia: apenas o máximo
  const tipScores = [];
  if (d.tipologiaApartamento) tipScores.push(3);
  if (d.tipologiaMoradia) tipScores.push(4);
  if (d.tipologiaOutro) tipScores.push(5);
  if (tipScores.length > 0) s += Math.max(...tipScores);

  // Contexto: apenas o máximo
  const ctxScores = [];
  if (d.contextoIsolado) ctxScores.push(2);
  if (d.contextoBairroSocial) ctxScores.push(7);
  if (d.contextoMeioUrbano) ctxScores.push(5);
  if (d.contextoMeioRural) ctxScores.push(3);
  if (ctxScores.length > 0) s += Math.max(...ctxScores);

  if (d.segurancaCaes) s += 4;
  if (d.segurancaPortaBlindada) s += 6;
  if (d.segurancaOutrasMedidas) s += 5;

  const pontuacao = Math.min(s, 100);
  let neop = pontuacao <= 25 ? "2º NEOP" : pontuacao <= 75 ? "3º NEOP" : "4º NEOP";
  
  // Critérios que elevam automaticamente para 4º NEOP
  const temAssociacaoCriminosa = d.modalidadeAssociacao;
  const temArmaRegistada = d.posseArma === "registada";
  const temArmaProbavel = d.posseArma === "provavel";
  const temUsoArma = d.usoArma === "haRegisto";
  const temAntecedentesContraFSS = d.antecedentesFSS === "sim";
  
  // Elevação 1: Associação criminosa + Posse/Probabilidade de armas de fogo
  if (temAssociacaoCriminosa && (temArmaRegistada || temArmaProbavel)) {
    neop = "4º NEOP";
  }
  
  // Elevação 2: Histórico de uso de arma de fogo + Antecedentes de confronto com FSS
  if (temUsoArma && temAntecedentesContraFSS) {
    neop = "4º NEOP";
  }
  
  return { pontuacao, neop };
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const EvaluationInput = z.object({
  pocPosto: z.string().optional(),
  pocNome: z.string().optional(),
  pocContacto: z.string().optional(),
  despacho: z.string().optional(),
  mandadoDetencao: z.number().int().default(0),
  mandadoBusca: z.number().int().default(0),
  quantidadeSuspeitos: z.string().default("1"),
  modalidadeIsolado: z.number().int().default(0),
  modalidadeAssociacao: z.number().int().default(0),
  tipoCriminal: z.string().default("outro"),
  antecedentesContraPessoas: z.number().int().default(0),
  antecedentesContraPatrimonio: z.number().int().default(0),
  antecedentesOutros: z.number().int().default(0),
  antecedentesFSS: z.string().default("nao"),
  posseArma: z.string().default("improvavel"),
  usoArma: z.string().default("naoHaRegisto"),
  tipologiaApartamento: z.number().int().default(0),
  tipologiaMoradia: z.number().int().default(0),
  tipologiaOutro: z.number().int().default(0),
  contextoIsolado: z.number().int().default(0),
  contextoBairroSocial: z.number().int().default(0),
  contextoMeioUrbano: z.number().int().default(0),
  contextoMeioRural: z.number().int().default(0),
  segurancaCaes: z.number().int().default(0),
  segurancaPortaBlindada: z.number().int().default(0),
  segurancaOutrasMedidas: z.number().int().default(0),
  avaliador: z.string().optional(),
  dataAvaliacao: z.string().optional(),
  parecer: z.string().optional(),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: authRouter,

  evaluations: router({
    list: protectedProcedure
      .input(z.object({ neop: z.string().optional(), avaliador: z.string().optional(), cterRequerente: z.string().optional() }))
      .query(async ({ input }) => {
        const rows = await getEvaluations(input);
        return rows;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const evaluation = await getEvaluationById(input.id);
        if (!evaluation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
        }
        return evaluation;
      }),

    create: protectedProcedure.input(EvaluationInput).mutation(async ({ input, ctx }) => {
      const { pontuacao, neop } = calcScore(input);
      await createEvaluation({ ...input, userId: ctx.user.id, pontuacao, neop });
      return { success: true, pontuacao, neop };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteEvaluation(input.id);
        return { success: true };
      }),

    preview: protectedProcedure.input(EvaluationInput).query(async ({ input }) => {
      return calcScore(input);
    }),

    getCters: protectedProcedure.query(async () => {
      return getUniqueCters();
    }),
  }),

  statistics: router({
    get: protectedProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        const stats = await getStatistics(startDate, endDate);
        return stats;
      }),

    neop4ByCter: protectedProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        const cterCounts = await getNeop4ByCter(startDate, endDate);
        return cterCounts;
      }),
  }),

  users: router({
    list: protectedProcedure.query(async () => {
      return getAllUsers();
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteUser(input.id);
        return { success: true };
      }),

    promoteToAdmin: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem promover utilizadores" });
        }

        const userToUpdate = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
        if (userToUpdate.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilizador não encontrado" });
        }

        await db.update(users).set({ role: "admin" }).where(eq(users.id, input.id));
        return { success: true };
      }),

    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem ver aprovações pendentes" });
      }
      return getPendingApprovals();
    }),

    approve: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem aprovar utilizadores" });
        }
        await approveUser(input.id);
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem rejeitar utilizadores" });
        }
        await rejectUser(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
