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
  createOperation,
  getOperationByEvaluationId,
  getOperationById,
  updateOperation,
  getOperationsByMonth,
  getOperationMonths,
  deleteOperations,
  createNotification,
  getNotificationsByOperation,
  markNotificationAsSent,
  updateOperationStatus,
  flagIncompleteOperations,
  getFlaggedOperations,
  getOperationWithAssignedUser,
} from "./db";
import { TRPCError } from "@trpc/server";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { operations } from "../drizzle/schema";

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
  nuipc: z.string().optional(),
  entidadeSolicitadora: z.string().optional(),
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

  operations: router({
    create: protectedProcedure
      .input(z.object({
        evaluationId: z.number().int(),
        refFiledoc: z.string().optional(),
        operacaoNumero: z.string().optional(),
        preenchimentoSecOp: z.string().optional(),
        cmdtOp: z.string().optional(),
        dataOp: z.string().optional(),
        tipoEmpenho: z.string().optional(),
        missao: z.string().optional(),
        entidadeSolicitadora: z.string().optional(),
        local: z.string().optional(),
        obsReuniao: z.string().optional(),
        gdhSaidaUI: z.string().optional(),
        gdhEntradaUI: z.string().optional(),
        cmdtForcaReuniao: z.string().optional(),
        indicativoRadioReuniao: z.string().optional(),
        efetivTotalReuniao: z.string().optional(),
        viaturasCaracterizadasReuniao: z.number().optional(),
        viaturasDescaracterizadasReuniao: z.number().optional(),
        viaturasEspeciaisReuniao: z.number().optional(),
        kmTotaisReuniao: z.string().optional(),
        cterOperacao: z.string().optional(),
        dterOperacao: z.string().optional(),
        pterZaOperacao: z.string().optional(),
        gdhInicioOperacao: z.string().optional(),
        gdhChegadaUIOperacao: z.string().optional(),
        cmdtForcaOperacao: z.string().optional(),
        indicativoRadioOperacao: z.string().optional(),
        efetivTotalOperacao: z.string().optional(),
        viaturasCaracterizadasOperacao: z.number().optional(),
        viaturasDescaracterizadasOperacao: z.number().optional(),
        viaturasEspeciaisOperacao: z.number().optional(),
        kmTotaisOperacao: z.string().optional(),
        itpTipo: z.string().optional(),
        gdhInicioITP: z.string().optional(),
        gdhFimITP: z.string().optional(),
        forcaTitularInqueritos: z.number().optional(),
        custosPortagens: z.string().optional(),
        custosCombustiveis: z.string().optional(),
        obsVisados: z.string().optional(),
        municoesArmasAuto762: z.number().optional(),
        municoesArmasAuto9mm: z.number().optional(),
        municoesArmasAuto762mm: z.number().optional(),
        municoesArmasAuto556mm: z.number().optional(),
        municoesArmasAuto556: z.number().optional(),
        municoesCacadeiraBarracha: z.number().optional(),
        municoesCacadeiraChumbo: z.number().optional(),
        municoesCacadeiraBeamBag: z.number().optional(),
        municoesCacadeiraZagalote: z.number().optional(),
        municoesCacadeiraZinco: z.number().optional(),
        municoesRevolverASP: z.number().optional(),
        taserCargaX26: z.number().optional(),
        taserGranadaFlashBang1Estalo: z.number().optional(),
        taserGranadaFlashBang1Estalo2Bang: z.number().optional(),
        taserGranadaFlashBang2Estalos2Bangs: z.number().optional(),
        taserGranadaFlashBangMultiplos: z.number().optional(),
        taserAlgemas: z.string().optional(),
        obsConsumos: z.string().optional(),
        obsSECOp: z.string().optional(),
        regSECOp: z.string().optional(),
        excelSECOp: z.number().optional(),
        apontamentosNotas: z.string().optional(),
        croquis: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { evaluationId, ...rest } = input;
        const operation = await createOperation({
          evaluationId,
          userId: ctx.user?.id || 0,
          ...rest,
        });
        return { success: true };
      }),

    getByEvaluationId: protectedProcedure
      .input(z.object({ evaluationId: z.number().int() }))
      .query(async ({ input }) => {
        return getOperationByEvaluationId(input.evaluationId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return getOperationById(input.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        refFiledoc: z.string().optional(),
        operacaoNumero: z.string().optional(),
        preenchimentoSecOp: z.string().optional(),
        cmdtOp: z.string().optional(),
        dataOp: z.string().optional(),
        tipoEmpenho: z.string().optional(),
        missao: z.string().optional(),
        entidadeSolicitadora: z.string().optional(),
        local: z.string().optional(),
        obsReuniao: z.string().optional(),
        gdhSaidaUI: z.string().optional(),
        gdhEntradaUI: z.string().optional(),
        cmdtForcaReuniao: z.string().optional(),
        indicativoRadioReuniao: z.string().optional(),
        efetivTotalReuniao: z.string().optional(),
        viaturasCaracterizadasReuniao: z.number().optional(),
        viaturasDescaracterizadasReuniao: z.number().optional(),
        viaturasEspeciaisReuniao: z.number().optional(),
        kmTotaisReuniao: z.string().optional(),
        cterOperacao: z.string().optional(),
        dterOperacao: z.string().optional(),
        pterZaOperacao: z.string().optional(),
        gdhInicioOperacao: z.string().optional(),
        gdhChegadaUIOperacao: z.string().optional(),
        cmdtForcaOperacao: z.string().optional(),
        indicativoRadioOperacao: z.string().optional(),
        efetivTotalOperacao: z.string().optional(),
        viaturasCaracterizadasOperacao: z.number().optional(),
        viaturasDescaracterizadasOperacao: z.number().optional(),
        viaturasEspeciaisOperacao: z.number().optional(),
        kmTotaisOperacao: z.string().optional(),
        itpTipo: z.string().optional(),
        gdhInicioITP: z.string().optional(),
        gdhFimITP: z.string().optional(),
        forcaTitularInqueritos: z.number().optional(),
        custosPortagens: z.string().optional(),
        custosCombustiveis: z.string().optional(),
        obsVisados: z.string().optional(),
        municoesArmasAuto762: z.number().optional(),
        municoesArmasAuto9mm: z.number().optional(),
        municoesArmasAuto762mm: z.number().optional(),
        municoesArmasAuto556mm: z.number().optional(),
        municoesArmasAuto556: z.number().optional(),
        municoesCacadeiraBarracha: z.number().optional(),
        municoesCacadeiraChumbo: z.number().optional(),
        municoesCacadeiraBeamBag: z.number().optional(),
        municoesCacadeiraZagalote: z.number().optional(),
        municoesCacadeiraZinco: z.number().optional(),
        municoesRevolverASP: z.number().optional(),
        taserCargaX26: z.number().optional(),
        taserGranadaFlashBang1Estalo: z.number().optional(),
        taserGranadaFlashBang1Estalo2Bang: z.number().optional(),
        taserGranadaFlashBang2Estalos2Bangs: z.number().optional(),
        taserGranadaFlashBangMultiplos: z.number().optional(),
        taserAlgemas: z.string().optional(),
        obsConsumos: z.string().optional(),
        obsSECOp: z.string().optional(),
        regSECOp: z.string().optional(),
        excelSECOp: z.number().optional(),
        apontamentosNotas: z.string().optional(),
        croquis: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateOperation(id, data);
        return { success: true };
      }),
    getMonths: protectedProcedure
      .query(async () => {
        return getOperationMonths();
      }),
    getByMonth: protectedProcedure
      .input(z.object({ month: z.string().optional() }))
      .query(async ({ input }) => {
        return getOperationsByMonth(input.month);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ ids: z.array(z.number().int()) }))
      .mutation(async ({ input }) => {
        return deleteOperations(input.ids);
      }),

    listMilitares: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        const militares = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          rank: users.rank,
          phoneNumber: users.phoneNumber,
          mecanographicNumber: users.mecanographicNumber,
        }).from(users);
        return militares;
      } catch (error) {
        console.error("Erro ao listar militares:", error);
        return [];
      }
    }),

    assignToMilitar: protectedProcedure
      .input(z.object({
        operationId: z.number().int(),
        assignedUserId: z.number().int(),
        scheduledDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.update(operations)
          .set({
            assignedUserId: input.assignedUserId,
            scheduledDate: input.scheduledDate,
          })
          .where(eq(operations.id, input.operationId));
        
        return { success: true };
      }),

    sendNotification: protectedProcedure
      .input(z.object({
        operationId: z.number().int(),
        userId: z.number().int(),
        phoneNumber: z.string(),
        militarName: z.string(),
        scheduledDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const message = `Olá ${input.militarName},\n\nFoi-lhe atribuída uma operação GIOE para a data de ${input.scheduledDate}.\n\nPor favor, preencha o relatório da operação no sistema.\n\nObrigado!`;
        const encodedMessage = encodeURIComponent(message);
        const phoneClean = input.phoneNumber.replace(/[^0-9]/g, '');
        const whatsappLink = `https://wa.me/${phoneClean}?text=${encodedMessage}`;
        
        const notification = await createNotification({
          operationId: input.operationId,
          userId: input.userId,
          phoneNumber: input.phoneNumber,
          message,
          whatsappLink,
        });
        
        return notification;
      }),

    getNotifications: protectedProcedure
      .input(z.object({ operationId: z.number().int() }))
      .query(async ({ input }) => {
        return getNotificationsByOperation(input.operationId);
      }),

    markNotificationAsSent: protectedProcedure
      .input(z.object({ notificationId: z.number().int() }))
      .mutation(async ({ input }) => {
        await markNotificationAsSent(input.notificationId);
        return { success: true };
      }),

    updateOperationStatus: protectedProcedure
      .input(z.object({
        operationId: z.number().int(),
        operacaoPreenchida: z.number().int().optional(),
        consumosPreenchidos: z.number().int().optional(),
        observacoesPreenchidas: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateOperationStatus(input.operationId, {
          operacaoPreenchida: input.operacaoPreenchida,
          consumosPreenchidos: input.consumosPreenchidos,
          observacoesPreenchidas: input.observacoesPreenchidas,
        });
        return { success: true };
      }),

    listMilitarOperations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const militarOperations = await db.select({
          id: operations.id,
          operacaoNumero: operations.operacaoNumero,
          dataOp: operations.dataOp,
          scheduledDate: operations.scheduledDate,
          operacaoPreenchida: operations.operacaoPreenchida,
          consumosPreenchidos: operations.consumosPreenchidos,
          observacoesPreenchidas: operations.observacoesPreenchidas,
          flaggedForCompletion: operations.flaggedForCompletion,
          flaggedAt: operations.flaggedAt,
          preenchimentoSecOp: operations.preenchimentoSecOp,
          cmdtOp: operations.cmdtOp,
          efetivTotalOperacao: operations.efetivTotalOperacao,
        }).from(operations).where(eq(operations.assignedUserId, ctx.user.id));
        return militarOperations;
      } catch (error) {
        console.error("Erro ao listar operações do militar:", error);
        return [];
      }
    }),

    flagIncompleteOperations: protectedProcedure
      .mutation(async () => {
        const count = await flagIncompleteOperations();
        return { flagged: count };
      }),

    getFlaggedOperations: protectedProcedure
      .query(async () => {
        return getFlaggedOperations();
      }),

    getOperationWithAssignedUser: protectedProcedure
      .input(z.object({ operationId: z.number().int() }))
      .query(async ({ input }) => {
        return getOperationWithAssignedUser(input.operationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
