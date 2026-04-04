import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import crypto from "crypto";

// ─── Validators ───────────────────────────────────────────────────────────────
const emailValidator = z.string().email().refine((email) => email.endsWith("@gnr.pt"), {
  message: "Email deve terminar em @gnr.pt",
});

const registerInput = z.object({
  email: emailValidator,
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

const loginInput = z.object({
  email: emailValidator,
  password: z.string().min(1, "Password é obrigatório"),
});

// ─── Auth Router ──────────────────────────────────────────────────────────────
export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  register: publicProcedure.input(registerInput).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Verificar se o email já existe
    const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email já registado",
      });
    }

    // Criar novo utilizador com email como openId
    const openId = `local_${input.email}`;
    
    // Considerar email já autenticado para utilizadores @gnr.pt
    await upsertUser({
      openId,
      email: input.email,
      name: input.name,
      loginMethod: "local",
      role: "user",
      emailVerified: 1, // Considerar email já autenticado
      lastSignedIn: new Date(),
    });

    const user = await getUserByOpenId(openId);
    if (!user) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao criar utilizador" });
    }

    // Criar session token e definir cookie
    const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

    return { success: true, user };
  }),

  login: publicProcedure.input(loginInput).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Procurar utilizador por email
    const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (result.length === 0) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Email não registado",
      });
    }

    const user = result[0];

    // Criar session token e definir cookie
    const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

    // Atualizar lastSignedIn
    await upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return { success: true, user };
  }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Procurar utilizador com o token de verificação
      const result = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token de verificação inválido ou expirado",
        });
      }

      const user = result[0];

      // Verificar se o token expirou
      if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token de verificação expirou. Por favor, registe-se novamente.",
        });
      }

      // Atualizar utilizador para marcar email como verificado
      await upsertUser({
        openId: user.openId,
        emailVerified: 1,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      });

      return { success: true, message: "Email verificado com sucesso! Pode agora fazer login." };
    }),

  resendVerificationEmail: publicProcedure
    .input(z.object({ email: emailValidator }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Procurar utilizador por email
      const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email não encontrado",
        });
      }

      const user = result[0];

      // Se já está verificado, não fazer nada
      if (user.emailVerified) {
        return { success: true, message: "Email já verificado" };
      }

      // Gerar novo token de verificação
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await upsertUser({
        openId: user.openId,
        emailVerificationToken,
        emailVerificationTokenExpires,
      });

      // TODO: Enviar email de confirmação com o novo token
      console.log(`Email de confirmação reenviado para ${input.email} com token ${emailVerificationToken}`);

      return { success: true, message: "Email de confirmação reenviado" };
    }),
});
