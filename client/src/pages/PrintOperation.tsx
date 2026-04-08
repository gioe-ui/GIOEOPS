import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";

export default function PrintOperation() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: operation, isLoading } = trpc.operations.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400">Registo de operação não encontrado</p>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === "" || value === 0) {
      return null;
    }
    return (
      <div key={label} className="mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-1">{String(value)}</p>
      </div>
    );
  };

  const renderSection = (title: string, fields: Array<[string, any]>) => {
    const visibleFields = fields.filter(([_, value]) => value !== null && value !== undefined && value !== "" && value !== 0);
    if (visibleFields.length === 0) return null;

    return (
      <div className="mb-6 pb-6 border-b border-gray-300">
        <h3 className="text-sm font-bold text-white bg-gray-700 px-3 py-2 mb-4 rounded">{title}</h3>
        <div className="grid grid-cols-2 gap-4">
          {visibleFields.map(([label, value]) => renderField(label, value))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            style={{ background: "#1a472a" }}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 rounded-lg shadow-lg print:shadow-none">
        {/* Logo e Cabeçalho */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <img
            src="https://d1lfxha46hqnrk.cloudfront.net/gioe-logo.png"
            alt="GIOE"
            className="h-16 mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold" style={{ color: "#1a472a" }}>
            REGISTO DE DADOS DA OPERAÇÃO
          </h1>
          <p className="text-xs text-gray-500 mt-2">
            Gerado em {new Date().toLocaleDateString("pt-PT")} às {new Date().toLocaleTimeString("pt-PT")}
          </p>
        </div>

        {/* Referência */}
        {renderSection("REFERÊNCIA", [
          ["Ref. Filedoc/E-Mail/Ordem Verbal", operation.refFiledoc],
          ["Operação Nº", operation.operacaoNumero],
          ["Preenchimento SECOp", operation.preenchimentoSecOp],
          ["CMDT Op", operation.cmdtOp],
          ["Data Op", operation.dataOp],
          ["Tipo Empenho", operation.tipoEmpenho],
          ["Entidade Solicitadora", operation.entidadeSolicitadora],
        ])}

        {/* Missão */}
        {operation.missao && (
          <div className="mb-6 pb-6 border-b border-gray-300">
            <h3 className="text-sm font-bold text-white bg-gray-700 px-3 py-2 mb-4 rounded">MISSÃO</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{operation.missao}</p>
          </div>
        )}

        {/* Dados Reunião Coordenação */}
        {renderSection("DADOS REUNIÃO COORDENAÇÃO", [
          ["Local", operation.local],
          ["Observações", operation.obsReuniao],
          ["GDH Saída UI", operation.gdhSaidaUI],
          ["GDH Entrada UI", operation.gdhEntradaUI],
          ["CMDT Força", operation.cmdtForcaReuniao],
          ["Indicativo Rádio", operation.indicativoRadioReuniao],
          ["Efetivo Total", operation.efetivTotalReuniao],
          ["Viaturas Caracterizadas", operation.viaturasCaracterizadasReuniao],
          ["Viaturas Descaracterizadas", operation.viaturasDescaracterizadasReuniao],
          ["Viaturas Especiais", operation.viaturasEspeciaisReuniao],
          ["Km Totais", operation.kmTotaisReuniao],
        ])}

        {/* Dados Operação ITP */}
        {renderSection("DADOS OPERAÇÃO ITP", [
          ["CTer", operation.cterOperacao],
          ["DTer", operation.dterOperacao],
          ["PTer/ZA", operation.pterZaOperacao],
          ["GDH Início", operation.gdhInicioOperacao],
          ["GDH Chegada UI", operation.gdhChegadaUIOperacao],
          ["CMDT Força", operation.cmdtForcaOperacao],
          ["Indicativo Rádio", operation.indicativoRadioOperacao],
          ["Efetivo Total", operation.efetivTotalOperacao],
          ["Viaturas Caracterizadas", operation.viaturasCaracterizadasOperacao],
          ["Viaturas Descaracterizadas", operation.viaturasDescaracterizadasOperacao],
          ["Viaturas Especiais", operation.viaturasEspeciaisOperacao],
          ["Km Totais", operation.kmTotaisOperacao],
        ])}

        {/* Tempo Resolução ITP */}
        {renderSection("TEMPO RESOLUÇÃO ITP", [
          ["ITP Tipo", operation.itpTipo],
          ["GDH Início", operation.gdhInicioITP],
          ["GDH Fim", operation.gdhFimITP],
        ])}

        {/* Força Titular do Inquérito */}
        {renderSection("FORÇA TITULAR DO INQUÉRITO", [
          ["Número Visados Detidos", operation.forcaTitularInqueritos],
          ["Custos Portagens", operation.custosPortagens],
          ["Custos Combustíveis", operation.custosCombustiveis],
          ["Observações", operation.obsVisados],
        ])}

        {/* Consumos */}
        {renderSection("CONSUMOS - MUNIÇÕES ARMAS AUTO", [
          ["7.62mm", operation.municoesArmasAuto762],
          ["9mm", operation.municoesArmasAuto9mm],
          ["7.62mm (alt)", operation.municoesArmasAuto762mm],
          ["5.56mm", operation.municoesArmasAuto556mm],
          ["5.56", operation.municoesArmasAuto556],
        ])}

        {renderSection("CONSUMOS - MUNIÇÕES CAÇADEIRA", [
          ["Barracha", operation.municoesCacadeiraBarracha],
          ["Chumbo", operation.municoesCacadeiraChumbo],
          ["Beam Bag", operation.municoesCacadeiraBeamBag],
          ["Zagalote", operation.municoesCacadeiraZagalote],
          ["Zinco", operation.municoesCacadeiraZinco],
        ])}

        {renderSection("CONSUMOS - MUNIÇÕES REVÓLVER / TASER", [
          ["Revólver ASP", operation.municoesRevolverASP],
          ["TASER Carga X26", operation.taserCargaX26],
          ["Granada Flash Bang 1 Estalo 1 Bang", operation.taserGranadaFlashBang1Estalo],
          ["Granada Flash Bang 1 Estalo 2 Bang", operation.taserGranadaFlashBang1Estalo2Bang],
          ["Granada Flash Bang 2 Estalos 2 Bangs", operation.taserGranadaFlashBang2Estalos2Bangs],
          ["Granada Flash Bang Múltiplos", operation.taserGranadaFlashBangMultiplos],
          ["Algemas", operation.taserAlgemas],
          ["Observações", operation.obsConsumos],
        ])}

        {/* Observações */}
        {renderSection("OBSERVAÇÕES", [
          ["Observações SECOp", operation.obsSECOp],
          ["Reg. SECOp", operation.regSECOp],
          ["Excel SECOp", operation.excelSECOp ? "Sim" : "Não"],
          ["Apontamentos / Notas", operation.apontamentosNotas],
          ["Croquis", operation.croquis],
        ])}

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300 text-center text-xs text-gray-500">
          <p>Documento gerado pelo sistema GIOE - Sistema de Avaliação de Pedidos de Apoio</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
