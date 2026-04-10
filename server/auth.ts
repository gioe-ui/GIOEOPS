import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";


// ─── Validators ───────────────────────────────────────────────────────────────
const emailValidator = z.string().email().refine((email) => email.endsWith("@gnr.pt"), {
  message: "Email deve terminar em @gnr.pt",
});

const registerInput = z.object({
  email: emailValidator,
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
  phoneNumber: z.string().min(9, "Número de telefone inválido"),
  mecanographicNumber: z.string().regex(/^\d{7}$/, "Número mecanográfico deve ter 7 dígitos"),
  rank: z.string().min(1, "Posto é obrigatório"),
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
    
    // Determinar se é admin (teixeira.vls@gnr.pt é admin por padrão)
    const isAdmin = input.email === "teixeira.vls@gnr.pt";
    const approved = isAdmin ? 1 : 0; // Admins são aprovados automaticamente
    
    await upsertUser({
      openId,
      email: input.email,
      name: input.name,
      loginMethod: "local",
      role: isAdmin ? "admin" : "user",
      approved,
      phoneNumber: input.phoneNumber,
      mecanographicNumber: input.mecanographicNumber,
      rank: input.rank,
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


});
