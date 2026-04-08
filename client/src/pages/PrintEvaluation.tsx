import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPO_LABELS: Record<string, string> = {
  trafico: "Tráfico",
  assalto: "Assalto",
  homicidio: "Homicídio",
  sequestro: "Sequestro",
  violencia: "Violência",
  outro: "Outro",
};

const POSSE_LABELS: Record<string, string> = {
  registada: "Registada",
  provavel: "Provável",
  improvavel: "Improvável",
};

const USO_LABELS: Record<string, string> = {
  haRegisto: "Há Registo",
  naoHaRegisto: "Não Há Registo",
};

const QTD_LABELS: Record<string, string> = {
  "1": "1 suspeito",
  "2": "2 suspeitos",
  "3": "3 suspeitos",
  "4+": "4+ suspeitos",
};

const NEOP_COLORS: Record<string, string> = {
  "2º NEOP": "#1a472a",
  "3º NEOP": "#b8860b",
  "4º NEOP": "#8b0000",
};

export default function PrintEvaluation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: evaluation, isLoading, error } = trpc.evaluations.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  useEffect(() => {
    if (isPrinting) {
      window.print();
      setIsPrinting(false);
    }
  }, [isPrinting]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#1a472a" }} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar avaliação</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const extractCter = (parecer: string | null): string => {
    if (!parecer) return "—";
    const match = parecer.match(/CTer:\s*([^\n,]+)/i);
    return match ? match[1].trim() : "—";
  };

  const cter = extractCter(evaluation.parecer);

  // Helper para verificar se uma seção tem conteúdo
  const hasSuspectosContent = evaluation.mandadoDetencao === 1 || evaluation.mandadoBusca === 1 || evaluation.quantidadeSuspeitos !== "1";
  const hasAtividadeCriminalContent = evaluation.modalidadeIsolado === 1 || evaluation.modalidadeAssociacao === 1 || evaluation.tipoCriminal || 
    evaluation.antecedentesContraPessoas === 1 || evaluation.antecedentesContraPatrimonio === 1 || 
    evaluation.antecedentesOutros === 1 || evaluation.antecedentesFSS;
  const hasMeiosContent = evaluation.posseArma || evaluation.usoArma;
  const hasLocalContent = evaluation.tipologiaApartamento === 1 || evaluation.tipologiaMoradia === 1 || evaluation.tipologiaOutro === 1 ||
    evaluation.contextoIsolado === 1 || evaluation.contextoBairroSocial === 1 || evaluation.contextoMeioUrbano === 1 || 
    evaluation.contextoMeioRural === 1 || evaluation.segurancaCaes === 1 || evaluation.segurancaPortaBlindada === 1 || 
    evaluation.segurancaOutrasMedidas === 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden on Print */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={() => setIsPrinting(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div id="form-container" className="bg-white p-8 rounded-lg print:rounded-none print:p-0">
          {/* Cabeçalho */}
          <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: "#1a472a" }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663511663974/bkxrxh5swZfcvrDKi6FHK/GIOE_NewLogo_7249f113.webp"
              alt="GIOE Logo"
              className="h-24 mx-auto mb-4"
              style={{ filter: "hue-rotate(110deg) saturate(0.4) brightness(0.75) contrast(1.2) invert(0.05)" }}
            />
            <div className="text-2xl font-bold" style={{ color: "#1a472a" }}>
              GIOE
            </div>
            <div className="text-sm" style={{ color: "#1a472a" }}>
              Grupo de Intervenção de Operações Especiais
            </div>
            <div className="text-xs mt-2" style={{ color: "#666" }}>
              Avaliação de Pedido de Apoio
            </div>
          </div>

          {/* POC e Despacho */}
          <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
            <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
              POC e Despacho
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {evaluation.pocPosto && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Posto/Função</div>
                  <div className="text-sm">{evaluation.pocPosto}</div>
                </div>
              )}
              {evaluation.pocNome && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Nome</div>
                  <div className="text-sm">{evaluation.pocNome}</div>
                </div>
              )}
              {evaluation.pocContacto && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Contacto</div>
                  <div className="text-sm">{evaluation.pocContacto}</div>
                </div>
              )}
            </div>
            {evaluation.despacho && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-1">Despacho</div>
                <div className="text-sm whitespace-pre-wrap">{evaluation.despacho}</div>
              </div>
            )}
            {cter !== "—" && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">CTer Requerente</div>
                <div className="text-sm">{cter}</div>
              </div>
            )}
          </div>

          {/* Suspeitos */}
          {hasSuspectosContent && (
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
              <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
                Suspeitos
              </div>
              {evaluation.mandadoDetencao === 1 && <div className="text-sm mb-2">✓ Mandado de Detenção</div>}
              {evaluation.mandadoBusca === 1 && <div className="text-sm mb-2">✓ Mandado de Busca</div>}
              {evaluation.quantidadeSuspeitos && evaluation.quantidadeSuspeitos !== "1" && (
                <div className="text-sm">Quantidade: {QTD_LABELS[evaluation.quantidadeSuspeitos] || evaluation.quantidadeSuspeitos}</div>
              )}
            </div>
          )}

          {/* Atividade Criminal */}
          {hasAtividadeCriminalContent && (
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
              <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
                Atividade Criminal
              </div>
              {evaluation.modalidadeIsolado === 1 && <div className="text-sm mb-2">✓ Modalidade: Isolado</div>}
              {evaluation.modalidadeAssociacao === 1 && <div className="text-sm mb-2">✓ Modalidade: Associação Criminosa</div>}
              {evaluation.tipoCriminal && (
                <div className="text-sm mb-2">Tipo Criminal: {TIPO_LABELS[evaluation.tipoCriminal] || evaluation.tipoCriminal}</div>
              )}
              {evaluation.antecedentesContraPessoas === 1 && <div className="text-sm mb-2">✓ Antecedentes Contra Pessoas</div>}
              {evaluation.antecedentesContraPatrimonio === 1 && <div className="text-sm mb-2">✓ Antecedentes Contra Património</div>}
              {evaluation.antecedentesOutros === 1 && <div className="text-sm mb-2">✓ Outros Antecedentes</div>}
              {evaluation.antecedentesFSS && (
                <div className="text-sm">Antecedentes FSS: {evaluation.antecedentesFSS === "sim" ? "Sim" : "Não"}</div>
              )}
            </div>
          )}

          {/* Meios */}
          {hasMeiosContent && (
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
              <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
                Meios
              </div>
              {evaluation.posseArma && (
                <div className="text-sm mb-2">Posse de Arma: {POSSE_LABELS[evaluation.posseArma] || evaluation.posseArma}</div>
              )}
              {evaluation.usoArma && (
                <div className="text-sm">Uso de Arma: {USO_LABELS[evaluation.usoArma] || evaluation.usoArma}</div>
              )}
            </div>
          )}

          {/* Local */}
          {hasLocalContent && (
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
              <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
                Local
              </div>
              {evaluation.tipologiaApartamento === 1 && <div className="text-sm mb-2">✓ Tipologia: Apartamento</div>}
              {evaluation.tipologiaMoradia === 1 && <div className="text-sm mb-2">✓ Tipologia: Moradia</div>}
              {evaluation.tipologiaOutro === 1 && <div className="text-sm mb-2">✓ Tipologia: Outro</div>}
              {evaluation.contextoIsolado === 1 && <div className="text-sm mb-2">✓ Contexto: Isolado</div>}
              {evaluation.contextoBairroSocial === 1 && <div className="text-sm mb-2">✓ Contexto: Bairro Social</div>}
              {evaluation.contextoMeioUrbano === 1 && <div className="text-sm mb-2">✓ Contexto: Meio Urbano</div>}
              {evaluation.contextoMeioRural === 1 && <div className="text-sm mb-2">✓ Contexto: Meio Rural</div>}
              {evaluation.segurancaCaes === 1 && <div className="text-sm mb-2">✓ Segurança: Cães</div>}
              {evaluation.segurancaPortaBlindada === 1 && <div className="text-sm mb-2">✓ Segurança: Porta Blindada</div>}
              {evaluation.segurancaOutrasMedidas === 1 && <div className="text-sm mb-2">✓ Segurança: Outras Medidas</div>}
            </div>
          )}

          {/* Classificação e Parecer */}
          <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
            <div className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
              Avaliação
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Pontuação</div>
                <div className="text-2xl font-bold" style={{ color: "#1a472a" }}>
                  {evaluation.pontuacao}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">NEOP</div>
                <div
                  className="px-3 py-1 rounded-full text-white text-sm font-bold inline-block"
                  style={{ background: NEOP_COLORS[evaluation.neop] || "#1a472a" }}
                >
                  {evaluation.neop}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Data</div>
                <div className="text-sm">{evaluation.dataAvaliacao || "—"}</div>
              </div>
            </div>
            {evaluation.avaliador && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-1">Avaliador</div>
                <div className="text-sm">{evaluation.avaliador}</div>
              </div>
            )}
            {evaluation.parecer && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Parecer</div>
                <div className="text-sm whitespace-pre-wrap">{evaluation.parecer}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          #form-container {
            box-shadow: none;
            border: none;
            page-break-inside: avoid;
          }
          .bg-gray-50 {
            background: #f9fafb !important;
          }
          .border-l-4 {
            border-left: 4px solid #1a472a !important;
          }
          .rounded-xl {
            border-radius: 0;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
