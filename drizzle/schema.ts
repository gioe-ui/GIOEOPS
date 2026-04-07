import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  tinyint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  approved: tinyint("approved").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // POC e Despacho
  pocPosto: varchar("pocPosto", { length: 255 }),
  pocNome: varchar("pocNome", { length: 255 }),
  pocContacto: varchar("pocContacto", { length: 255 }),
  despacho: text("despacho"),
  // Suspeitos
  mandadoDetencao: int("mandadoDetencao").default(0),
  mandadoBusca: int("mandadoBusca").default(0),
  quantidadeSuspeitos: varchar("quantidadeSuspeitos", { length: 10 }),
  // Atividade Criminal
  modalidadeIsolado: int("modalidadeIsolado").default(0),
  modalidadeAssociacao: int("modalidadeAssociacao").default(0),
  tipoCriminal: varchar("tipoCriminal", { length: 50 }),
  antecedentesContraPessoas: int("antecedentesContraPessoas").default(0),
  antecedentesContraPatrimonio: int("antecedentesContraPatrimonio").default(0),
  antecedentesOutros: int("antecedentesOutros").default(0),
  antecedentesFSS: varchar("antecedentesFSS", { length: 10 }),
  // Meios
  posseArma: varchar("posseArma", { length: 50 }),
  usoArma: varchar("usoArma", { length: 50 }),
  // Local
  tipologiaApartamento: int("tipologiaApartamento").default(0),
  tipologiaMoradia: int("tipologiaMoradia").default(0),
  tipologiaOutro: int("tipologiaOutro").default(0),
  contextoIsolado: int("contextoIsolado").default(0),
  contextoBairroSocial: int("contextoBairroSocial").default(0),
  contextoMeioUrbano: int("contextoMeioUrbano").default(0),
  contextoMeioRural: int("contextoMeioRural").default(0),
  segurancaCaes: int("segurancaCaes").default(0),
  segurancaPortaBlindada: int("segurancaPortaBlindada").default(0),
  segurancaOutrasMedidas: int("segurancaOutrasMedidas").default(0),
  // Avaliação
  avaliador: varchar("avaliador", { length: 255 }),
  dataAvaliacao: varchar("dataAvaliacao", { length: 20 }),
  parecer: text("parecer"),
  // Resultado
  pontuacao: int("pontuacao").notNull().default(0),
  neop: varchar("neop", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;
