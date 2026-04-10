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
  // Novos campos de perfil
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  mecanographicNumber: varchar("mecanographicNumber", { length: 10 }),
  rank: varchar("rank", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // NUIPC e Entidade Solicitadora
  nuipc: varchar("nuipc", { length: 50 }),
  entidadeSolicitadora: varchar("entidadeSolicitadora", { length: 100 }),
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

export const operations = mysqlTable("operations", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  userId: int("userId").notNull(),
  // Referência
  refFiledoc: varchar("refFiledoc", { length: 255 }),
  operacaoNumero: varchar("operacaoNumero", { length: 50 }),
  preenchimentoSecOp: varchar("preenchimentoSecOp", { length: 50 }),
  cmdtOp: varchar("cmdtOp", { length: 255 }),
  dataOp: varchar("dataOp", { length: 20 }),
  // Tipo Empenho
  tipoEmpenho: varchar("tipoEmpenho", { length: 50 }),
  // Missão
  missao: text("missao"),
  // Entidade Solicitadora
  entidadeSolicitadora: varchar("entidadeSolicitadora", { length: 50 }),
  // Dados Reunião Coordenação
  local: text("local"),
  obsReuniao: text("obsReuniao"),
  gdhSaidaUI: varchar("gdhSaidaUI", { length: 50 }),
  gdhEntradaUI: varchar("gdhEntradaUI", { length: 50 }),
  cmdtForcaReuniao: varchar("cmdtForcaReuniao", { length: 255 }),
  indicativoRadioReuniao: varchar("indicativoRadioReuniao", { length: 50 }),
  efetivTotalReuniao: varchar("efetivTotalReuniao", { length: 50 }),
  // Atribuição de Operação
  assignedUserId: int("assignedUserId"),
  scheduledDate: varchar("scheduledDate", { length: 20 }),
  // Viaturas Reunião
  viaturasCaracterizadasReuniao: int("viaturasCaracterizadasReuniao").default(0),
  viaturasDescaracterizadasReuniao: int("viaturasDescaracterizadasReuniao").default(0),
  viaturasEspeciaisReuniao: int("viaturasEspeciaisReuniao").default(0),
  kmTotaisReuniao: varchar("kmTotaisReuniao", { length: 50 }),
  // Dados Operação ITP
  cterOperacao: varchar("cterOperacao", { length: 255 }),
  dterOperacao: varchar("dterOperacao", { length: 255 }),
  pterZaOperacao: varchar("pterZaOperacao", { length: 255 }),
  gdhInicioOperacao: varchar("gdhInicioOperacao", { length: 50 }),
  gdhChegadaUIOperacao: varchar("gdhChegadaUIOperacao", { length: 50 }),
  cmdtForcaOperacao: varchar("cmdtForcaOperacao", { length: 255 }),
  indicativoRadioOperacao: varchar("indicativoRadioOperacao", { length: 50 }),
  efetivTotalOperacao: varchar("efetivTotalOperacao", { length: 50 }),
  // Viaturas Operação
  viaturasCaracterizadasOperacao: int("viaturasCaracterizadasOperacao").default(0),
  viaturasDescaracterizadasOperacao: int("viaturasDescaracterizadasOperacao").default(0),
  viaturasEspeciaisOperacao: int("viaturasEspeciaisOperacao").default(0),
  kmTotaisOperacao: varchar("kmTotaisOperacao", { length: 50 }),
  // Tempo Resolução ITP
  itpTipo: varchar("itpTipo", { length: 50 }),
  gdhInicioITP: varchar("gdhInicioITP", { length: 50 }),
  gdhFimITP: varchar("gdhFimITP", { length: 50 }),
  // Força Titular do Inquérito
  forcaTitularInqueritos: int("forcaTitularInqueritos").default(0),
  custosPortagens: text("custosPortagens"),
  custosCombustiveis: text("custosCombustiveis"),
  obsVisados: text("obsVisados"),
  // Consumos
  municoesArmasAuto762: int("municoesArmasAuto762").default(0),
  municoesArmasAuto9mm: int("municoesArmasAuto9mm").default(0),
  municoesArmasAuto762mm: int("municoesArmasAuto762mm").default(0),
  municoesArmasAuto556mm: int("municoesArmasAuto556mm").default(0),
  municoesArmasAuto556: int("municoesArmasAuto556").default(0),
  municoesCacadeiraBarracha: int("municoesCacadeiraBarracha").default(0),
  municoesCacadeiraChumbo: int("municoesCacadeiraChumbo").default(0),
  municoesCacadeiraBeamBag: int("municoesCacadeiraBeamBag").default(0),
  municoesCacadeiraZagalote: int("municoesCacadeiraZagalote").default(0),
  municoesCacadeiraZinco: int("municoesCacadeiraZinco").default(0),
  municoesRevolverASP: int("municoesRevolverASP").default(0),
  taserCargaX26: int("taserCargaX26").default(0),
  taserGranadaFlashBang1Estalo: int("taserGranadaFlashBang1Estalo").default(0),
  taserGranadaFlashBang1Estalo2Bang: int("taserGranadaFlashBang1Estalo2Bang").default(0),
  taserGranadaFlashBang2Estalos2Bangs: int("taserGranadaFlashBang2Estalos2Bangs").default(0),
  taserGranadaFlashBangMultiplos: int("taserGranadaFlashBangMultiplos").default(0),
  taserAlgemas: varchar("taserAlgemas", { length: 50 }),
  obsConsumos: text("obsConsumos"),
  // Observações
  obsSECOp: text("obsSECOp"),
  regSECOp: varchar("regSECOp", { length: 255 }),
  excelSECOp: tinyint("excelSECOp").default(0),
  apontamentosNotas: text("apontamentosNotas"),
  croquis: text("croquis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = typeof operations.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  operationId: int("operationId").notNull(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  message: text("message").notNull(),
  whatsappLink: text("whatsappLink").notNull(),
  sent: tinyint("sent").default(0).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
