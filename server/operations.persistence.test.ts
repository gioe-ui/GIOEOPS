import { describe, it, expect, beforeAll } from "vitest";
import { createOperation, getOperationByEvaluationId } from "./db";

describe("Operations Persistence", () => {
  let testEvaluationId: number;

  beforeAll(async () => {
    // Usar um ID de avaliação de teste único
    testEvaluationId = Math.floor(Math.random() * 100000) + 50000;
  });

  it("should create a new operation with all fields", async () => {
    const operationData = {
      evaluationId: testEvaluationId,
      userId: 1,
      operacaoNumero: "OP-TEST-001",
      cmdtOp: "Cmdt Teste",
      dataOp: "2026-04-10",
      cterOperacao: "CTER Teste",
      dterOperacao: "DTER Teste",
      pterZaOperacao: "PTER Teste",
      gdhInicioOperacao: "10:00",
      gdhChegadaUIOperacao: "12:00",
      cmdtForcaOperacao: "Cmdt Força",
      indicativoRadioOperacao: "Indicativo",
      efetivTotalOperacao: "20",
      viaturasCaracterizadasOperacao: 2,
      viaturasDescaracterizadasOperacao: 1,
      viaturasEspeciaisOperacao: 1,
      kmTotaisOperacao: "150",
      municoesArmasAuto762: 10,
      municoesArmasAuto9mm: 5,
      taserCargaX26: 3,
      obsSECOp: "Observação de teste",
      apontamentosNotas: "Apontamentos de teste",
      operacaoPreenchida: 1,
      consumosPreenchidos: 1,
      observacoesPreenchidas: 1,
    };

    const operation = await createOperation(operationData);
    expect(operation).toBeDefined();
    expect(operation?.operacaoNumero).toBe("OP-TEST-001");
    expect(operation?.cmdtOp).toBe("Cmdt Teste");
    expect(operation?.dataOp).toBe("2026-04-10");
    expect(operation?.operacaoPreenchida).toBe(1);
    expect(operation?.consumosPreenchidos).toBe(1);
    expect(operation?.observacoesPreenchidas).toBe(1);
  });

  it("should retrieve operation with all fields intact after creation", async () => {
    const operation = await getOperationByEvaluationId(testEvaluationId);
    expect(operation).toBeDefined();
    expect(operation?.operacaoNumero).toBe("OP-TEST-001");
    expect(operation?.cmdtOp).toBe("Cmdt Teste");
    expect(operation?.dataOp).toBe("2026-04-10");
    expect(operation?.cterOperacao).toBe("CTER Teste");
    expect(operation?.dterOperacao).toBe("DTER Teste");
    expect(operation?.pterZaOperacao).toBe("PTER Teste");
    expect(operation?.gdhInicioOperacao).toBe("10:00");
    expect(operation?.gdhChegadaUIOperacao).toBe("12:00");
    expect(operation?.cmdtForcaOperacao).toBe("Cmdt Força");
    expect(operation?.indicativoRadioOperacao).toBe("Indicativo");
    expect(operation?.efetivTotalOperacao).toBe("20");
    expect(operation?.viaturasCaracterizadasOperacao).toBe(2);
    expect(operation?.viaturasDescaracterizadasOperacao).toBe(1);
    expect(operation?.viaturasEspeciaisOperacao).toBe(1);
    expect(operation?.kmTotaisOperacao).toBe("150");
    expect(operation?.municoesArmasAuto762).toBe(10);
    expect(operation?.municoesArmasAuto9mm).toBe(5);
    expect(operation?.taserCargaX26).toBe(3);
    expect(operation?.obsSECOp).toBe("Observação de teste");
    expect(operation?.apontamentosNotas).toBe("Apontamentos de teste");
    expect(operation?.operacaoPreenchida).toBe(1);
    expect(operation?.consumosPreenchidos).toBe(1);
    expect(operation?.observacoesPreenchidas).toBe(1);
  });

  it("should correctly determine completion status based on status fields", async () => {
    const operation = await getOperationByEvaluationId(testEvaluationId);
    
    // Verificar que todos os campos de status foram persistidos
    expect(operation?.operacaoPreenchida).toBe(1);
    expect(operation?.consumosPreenchidos).toBe(1);
    expect(operation?.observacoesPreenchidas).toBe(1);
    
    // Todos os campos preenchidos = operação completa (verde)
    const isComplete = 
      operation?.operacaoPreenchida === 1 && 
      operation?.consumosPreenchidos === 1 && 
      operation?.observacoesPreenchidas === 1;
    
    expect(isComplete).toBe(true);
  });

  it("should handle partial completion status", async () => {
    // Criar operação com apenas alguns campos preenchidos
    const testEvalId2 = Math.floor(Math.random() * 100000) + 50000;
    
    const operationData = {
      evaluationId: testEvalId2,
      userId: 1,
      operacaoNumero: "OP-PARTIAL",
      cmdtOp: "Cmdt Teste",
      dataOp: "2026-04-10",
      operacaoPreenchida: 1,
      consumosPreenchidos: 0, // Não preenchido
      observacoesPreenchidas: 0, // Não preenchido
    };

    const operation = await createOperation(operationData);
    expect(operation).toBeDefined();

    const retrieved = await getOperationByEvaluationId(testEvalId2);
    expect(retrieved?.operacaoPreenchida).toBe(1);
    expect(retrieved?.consumosPreenchidos).toBe(0);
    expect(retrieved?.observacoesPreenchidas).toBe(0);

    // Parcialmente preenchido = amarelo
    const isPartial = 
      (retrieved?.operacaoPreenchida === 1 || 
       retrieved?.consumosPreenchidos === 1 || 
       retrieved?.observacoesPreenchidas === 1) &&
      !(retrieved?.operacaoPreenchida === 1 && 
        retrieved?.consumosPreenchidos === 1 && 
        retrieved?.observacoesPreenchidas === 1);
    
    expect(isPartial).toBe(true);
  });

  it("should handle empty operation status", async () => {
    // Criar operação sem nenhum campo preenchido
    const testEvalId3 = Math.floor(Math.random() * 100000) + 50000;
    
    const operationData = {
      evaluationId: testEvalId3,
      userId: 1,
      operacaoPreenchida: 0,
      consumosPreenchidos: 0,
      observacoesPreenchidas: 0,
    };

    const operation = await createOperation(operationData);
    expect(operation).toBeDefined();

    const retrieved = await getOperationByEvaluationId(testEvalId3);
    expect(retrieved?.operacaoPreenchida).toBe(0);
    expect(retrieved?.consumosPreenchidos).toBe(0);
    expect(retrieved?.observacoesPreenchidas).toBe(0);

    // Nenhum preenchido = vermelho
    const isEmpty = 
      retrieved?.operacaoPreenchida === 0 && 
      retrieved?.consumosPreenchidos === 0 && 
      retrieved?.observacoesPreenchidas === 0;
    
    expect(isEmpty).toBe(true);
  });
});
