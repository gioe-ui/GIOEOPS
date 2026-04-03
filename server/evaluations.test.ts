import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "teste@gnr.pt",
    name: "Teste GNR",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// ─── Scoring logic tests (via preview procedure) ──────────────────────────────
describe("evaluations scoring", () => {
  const baseInput = {
    mandadoDetencao: 0,
    mandadoBusca: 0,
    quantidadeSuspeitos: "1",
    modalidadeIsolado: 0,
    modalidadeAssociacao: 0,
    tipoCriminal: "outro",
    antecedentesContraPessoas: 0,
    antecedentesContraPatrimonio: 0,
    antecedentesOutros: 0,
    antecedentesFSS: "nao",
    posseArma: "improvavel",
    usoArma: "naoHaRegisto",
    tipologiaApartamento: 0,
    tipologiaMoradia: 0,
    tipologiaOutro: 0,
    contextoIsolado: 0,
    contextoBairroSocial: 0,
    contextoMeioUrbano: 0,
    contextoMeioRural: 0,
    segurancaCaes: 0,
    segurancaPortaBlindada: 0,
    segurancaOutrasMedidas: 0,
  };

  it("calculates minimum score correctly — 2º NEOP", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview(baseInput);
    // 1 (qty) + 4 (outro) + 2 (improvavel) + 3 (naoHaRegisto) = 10
    expect(result.pontuacao).toBe(10);
    expect(result.neop).toBe("2º NEOP");
  });

  it("mandado de detenção adds 5 points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({ ...baseInput, mandadoDetencao: 1 });
    expect(result.pontuacao).toBe(15);
  });

  it("homicídio type adds 10 points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({ ...baseInput, tipoCriminal: "homicidio" });
    // 1 + 10 + 2 + 3 = 16
    expect(result.pontuacao).toBe(16);
  });

  it("antecedentes FSS sim adds 9 points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({ ...baseInput, antecedentesFSS: "sim" });
    expect(result.pontuacao).toBe(19);
  });

  it("high score results in 4º NEOP", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({
      ...baseInput,
      mandadoDetencao: 1,
      mandadoBusca: 1,
      quantidadeSuspeitos: "4+",
      modalidadeAssociacao: 1,
      tipoCriminal: "homicidio",
      antecedentesContraPessoas: 1,
      antecedentesFSS: "sim",
      posseArma: "registada",
      usoArma: "haRegisto",
      tipologiaMoradia: 1,
      contextoBairroSocial: 1,
      segurancaPortaBlindada: 1,
    });
    // 5+3+6+8+10+8+9+8+10+4+7+6 = 84 → 4º NEOP (capped at 100)
    expect(result.pontuacao).toBeGreaterThan(50);
    expect(result.neop).toBe("4º NEOP");
  });

  it("score is capped at 100", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({
      ...baseInput,
      mandadoDetencao: 1,
      mandadoBusca: 1,
      quantidadeSuspeitos: "4+",
      modalidadeIsolado: 1,
      modalidadeAssociacao: 1,
      tipoCriminal: "homicidio",
      antecedentesContraPessoas: 1,
      antecedentesContraPatrimonio: 1,
      antecedentesOutros: 1,
      antecedentesFSS: "sim",
      posseArma: "registada",
      usoArma: "haRegisto",
      tipologiaMoradia: 1,
      contextoBairroSocial: 1,
      segurancaCaes: 1,
      segurancaPortaBlindada: 1,
      segurancaOutrasMedidas: 1,
    });
    expect(result.pontuacao).toBeLessThanOrEqual(100);
  });

  it("3º NEOP for score between 26 and 50", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evaluations.preview({
      ...baseInput,
      mandadoDetencao: 1,
      mandadoBusca: 1,
      quantidadeSuspeitos: "2",
      tipoCriminal: "assalto",
      antecedentesContraPessoas: 1,
      posseArma: "provavel",
    });
    // 5+3+2+6+8+6+3 = 33 → 3º NEOP
    expect(result.neop).toBe("3º NEOP");
  });

  it("tipologia only counts the maximum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Apartamento (+3) and moradia (+4) selected → only +4 counted
    const withBoth = await caller.evaluations.preview({
      ...baseInput,
      tipologiaApartamento: 1,
      tipologiaMoradia: 1,
    });
    const withMoradia = await caller.evaluations.preview({
      ...baseInput,
      tipologiaMoradia: 1,
    });
    expect(withBoth.pontuacao).toBe(withMoradia.pontuacao);
  });

  it("contexto only counts the maximum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const withBairro = await caller.evaluations.preview({
      ...baseInput,
      contextoBairroSocial: 1,
    });
    const withBairroAndRural = await caller.evaluations.preview({
      ...baseInput,
      contextoBairroSocial: 1,
      contextoMeioRural: 1,
    });
    expect(withBairro.pontuacao).toBe(withBairroAndRural.pontuacao);
  });
});

// ─── Auth logout test ─────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const user: AuthenticatedUser = {
      id: 1,
      openId: "sample-user",
      email: "sample@gnr.pt",
      name: "Sample User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});
