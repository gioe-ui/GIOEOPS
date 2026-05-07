import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, User, AlertTriangle, Crosshair, MapPin, ClipboardList, Download } from "lucide-react";
import { SuspectForm, Suspect } from "@/components/SuspectForm";


// ─── Scoring ─────────────────────────────────────────────────────────────────
const TIPO_SCORES: Record<string, number> = {
  trafico: 7, assalto: 6, homicidio: 10, sequestro: 9, violencia: 8, outro: 4,
};
const POSSE_SCORES: Record<string, number> = { registada: 8, provavel: 6, improvavel: 2 };
const USO_SCORES: Record<string, number> = { haRegisto: 10, naoHaRegisto: 3 };
const QTD_SCORES: Record<string, number> = { "1": 1, "2": 2, "3": 4, "4+": 6 };

type FormState = {
  nuipc: string; entidadeSolicitadora: string; refFiledoc: string; email: string; ordemVerbal: string;
  pocPosto: string; pocNome: string; pocContacto: string; despacho: string; cterRequerente: string; // Armazenado no parecer
  mandadoDetencao: boolean; mandadoBusca: boolean;
  quantidadeSuspeitos: string;
  modalidadeIsolado: boolean; modalidadeAssociacao: boolean;
  tipoCriminal: string[];
  antecedentesContraPessoas: boolean; antecedentesContraPatrimonio: boolean; antecedentesOutros: boolean;
  antecedentesFSS: string;
  posseArma: string; usoArma: string;
  tipologiaApartamento: boolean; tipologiaMoradia: boolean; tipologiaOutro: boolean;
  contextoIsolado: boolean; contextoBairroSocial: boolean; contextoMeioUrbano: boolean; contextoMeioRural: boolean;
  segurancaCaes: boolean; segurancaPortaBlindada: boolean; segurancaOutrasMedidas: boolean;
  avaliador: string; dataAvaliacao: string; parecer: string;
  neopManual: string; // Campo para sobrescrever NEOP calculado
  observacoes: string; // Observações após Local
  outrasObservacoes: string; // Outras observações antes do Parecer
};

const DEFAULT: FormState = {
  nuipc: "", entidadeSolicitadora: "", refFiledoc: "", email: "", ordemVerbal: "",
  pocPosto: "", pocNome: "", pocContacto: "", despacho: "", cterRequerente: "",
  mandadoDetencao: false, mandadoBusca: false, quantidadeSuspeitos: "1",
  modalidadeIsolado: false, modalidadeAssociacao: false, tipoCriminal: ["outro"],
  antecedentesContraPessoas: false, antecedentesContraPatrimonio: false, antecedentesOutros: false,
  antecedentesFSS: "nao", posseArma: "improvavel", usoArma: "naoHaRegisto",
  tipologiaApartamento: false, tipologiaMoradia: false, tipologiaOutro: false,
  contextoIsolado: false, contextoBairroSocial: false, contextoMeioUrbano: false, contextoMeioRural: false,
  segurancaCaes: false, segurancaPortaBlindada: false, segurancaOutrasMedidas: false,
  avaliador: "", dataAvaliacao: new Date().toISOString().split("T")[0], parecer: "",
  neopManual: "",
  observacoes: "",
  outrasObservacoes: "",
};

function calcScore(f: FormState): { pontuacao: number; neop: string; complexidade: string; descricao: string; neopColor: string } {
  let s = 0;
  if (f.mandadoDetencao) s += 5;
  if (f.mandadoBusca) s += 3;
  s += QTD_SCORES[f.quantidadeSuspeitos] ?? 1;
  if (f.modalidadeIsolado) s += 2;
  if (f.modalidadeAssociacao) s += 8;
  // Somar pontos de todos os tipos de crime selecionados
  const crimeScores = f.tipoCriminal.map(tipo => TIPO_SCORES[tipo] ?? 4);
  s += crimeScores.length > 0 ? Math.max(...crimeScores) : 4;
  if (f.antecedentesContraPessoas) s += 8;
  if (f.antecedentesContraPatrimonio) s += 5;
  if (f.antecedentesOutros) s += 3;
  if (f.antecedentesFSS === "sim") s += 9;
  s += POSSE_SCORES[f.posseArma] ?? 2;
  s += USO_SCORES[f.usoArma] ?? 3;
  const tipScores = [f.tipologiaApartamento && 3, f.tipologiaMoradia && 4, f.tipologiaOutro && 5].filter(Boolean) as number[];
  if (tipScores.length > 0) s += Math.max(...tipScores);
  const ctxScores = [f.contextoIsolado && 2, f.contextoBairroSocial && 7, f.contextoMeioUrbano && 5, f.contextoMeioRural && 3].filter(Boolean) as number[];
  if (ctxScores.length > 0) s += Math.max(...ctxScores);
  if (f.segurancaCaes) s += 4;
  if (f.segurancaPortaBlindada) s += 6;
  if (f.segurancaOutrasMedidas) s += 5;
  const pontuacao = Math.min(s, 100);
  let neop = pontuacao <= 25 ? "2º NEOP" : pontuacao <= 75 ? "3º NEOP" : "4º NEOP";
  
  // Critérios que elevam automaticamente para 4º NEOP
  const temAssociacaoCriminosa = f.modalidadeAssociacao;
  const temArmaRegistada = f.posseArma === "registada";
  const temArmaProbavel = f.posseArma === "provavel";
  const temUsoArma = f.usoArma === "haRegisto";
  const temAntecedentesContraPessoas = f.antecedentesContraPessoas;
  const temAntecedentesContraFSS = f.antecedentesFSS === "sim";
  const temCrimeGrave = f.tipoCriminal.some(tipo => ["homicidio", "sequestro", "violencia"].includes(tipo));
  
  // Elevação 1: Associação criminosa + Posse/Probabilidade de armas de fogo
  if (temAssociacaoCriminosa && (temArmaRegistada || temArmaProbavel)) {
    neop = "4º NEOP";
  }
  
  // Elevação 2: Histórico de uso de arma de fogo + Antecedentes de confronto com FSS
  if (temUsoArma && temAntecedentesContraFSS) {
    neop = "4º NEOP";
  }
  
  // Elevação 3: Arma registada + Crime grave (homicídio, sequestro, violência)
  if (temArmaRegistada && temCrimeGrave) {
    neop = "4º NEOP";
  }
  
  // Elevação 4: Arma provável + Uso com registo
  if (temArmaProbavel && temUsoArma) {
    neop = "4º NEOP";
  }
  
  // Sobrescrever com NEOP manual se fornecido
  if (f.neopManual && ["2º NEOP", "3º NEOP", "4º NEOP"].includes(f.neopManual)) {
    neop = f.neopManual;
  }
  
  // Complexidade e cores
  let complexidade = "Baixa";
  let descricao = "Operação de rotina - Procedimentos padrão";
  let neopColor = "#22c55e"; // Verde para 2º NEOP
  if (neop === "3º NEOP") {
    complexidade = "Média";
    descricao = "Operação com risco moderado - Requer coordenação";
    neopColor = "#f97316"; // Laranja para 3º NEOP
  } else if (neop === "4º NEOP") {
    complexidade = "Alta";
    descricao = "Necessita de planeamento especializado";
    neopColor = "#ef4444"; // Vermelho para 4º NEOP
  }
  
  return { pontuacao, neop, complexidade, descricao, neopColor };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <span style={{ color: "#1a472a" }}>{icon}</span>
    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#1a472a" }}>
      {title}
    </h3>
  </div>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-50 rounded-xl p-5 mb-5 border-l-4" style={{ borderColor: "#1a472a" }}>
    {children}
  </div>
);

const CheckItem = ({
  id, label, checked, onCheckedChange,
}: { id: string; label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-2 py-1">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange}
      className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
    <label htmlFor={id} className="text-sm cursor-pointer text-gray-700">{label}</label>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EvaluationForm() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [showConfirm, setShowConfirm] = useState(false);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const utils = trpc.useUtils();

  const { pontuacao, neop, complexidade, descricao, neopColor: neopColorFromCalc } = calcScore(form);



  const suspectsMutation = trpc.suspects.createBatch.useMutation();

  const createMutation = trpc.evaluations.create.useMutation({
    onSuccess: (result: any) => {
      // Guardar suspeitos se existirem
      if (suspects.length > 0 && result?.evaluationId) {
        suspectsMutation.mutate({
          evaluationId: result.evaluationId,
          suspects: suspects.map(s => ({
            nome: s.nome,
            dataNascimento: s.dataNascimento,
            nacionalidade: s.nacionalidade,
            nif: s.nif,
            cc: s.cc,
            morada: s.morada,
            observacoes: s.observacoes,
          })),
        });
      }
      toast.success("Avaliação guardada com sucesso!");
      setForm({ ...DEFAULT, dataAvaliacao: new Date().toISOString().split("T")[0] });
      setSuspects([]);
      setShowConfirm(false);
      utils.evaluations.list.invalidate();
      utils.statistics.get.invalidate();
      utils.statistics.neop4ByCter.invalidate();
    },
    onError: (e) => toast.error("Erro ao guardar: " + e.message),
  });

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);





  const handleDownloadPDF = () => {
    const element = document.getElementById("form-container");
    if (!element) {
      toast.error("Elemento do formulário não encontrado");
      return;
    }
    try {
      // Criar uma nova janela para impressão
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Não foi possível abrir a janela de impressão");
        return;
      }
      
      // Copiar o HTML do formulário
      const html = element.innerHTML;
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join("\n");
          } catch {
            return "";
          }
        })
        .join("\n");
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Avaliação - ${form.nuipc || "sem-nuipc"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            ${styles}
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `);
      printWindow.document.close();
      
      // Aguardar o carregamento e depois imprimir
      setTimeout(() => {
        printWindow.print();
        toast.success("Janela de impressão aberta!");
      }, 500);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: "#1a472a" }}>
          Novo Formulário de Avaliação
        </h2>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-orange-600 border-orange-600 hover:bg-orange-50 transition"
          title="Descarregar como PDF"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>

      <div id="form-container" className="bg-white p-6 rounded-lg">
        {/* Cabeçalho do PDF */}
        <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: "#1a472a" }}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663511663974/bkxrxh5szwZfcvrDKi6FHK/GIOE_NewLogo_7249f113.webp" alt="GIOE Logo" className="h-24 mx-auto mb-4" style={{ filter: "hue-rotate(110deg) saturate(0.4) brightness(0.75) contrast(1.2) invert(0.05)" }} />
          <div className="text-2xl font-bold" style={{ color: "#1a472a" }}>GIOE</div>
          <div className="text-sm" style={{ color: "#1a472a" }}>Grupo de Intervenção de Operações Especiais</div>
          <div className="text-xs mt-2" style={{ color: "#666" }}>Avaliação de Pedido de Apoio</div>
        </div>

        {/* NUIPC e Entidade Solicitadora */}
      <Section>
        <SectionTitle icon={<Crosshair className="w-4 h-4" />} title="Identificação e Entidade Solicitadora" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">NUIPC</Label>
            <Input placeholder="Número de identificação" value={form.nuipc} onChange={(e) => set("nuipc", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Entidade Solicitadora</Label>
            <div className="space-y-2">
              {["CO", "CTer", "PSP", "PJ", "Outra"].map((entity) => (
                <div key={entity} className="flex items-center">
                  <Checkbox
                    id={`entity-${entity}`}
                    checked={form.entidadeSolicitadora === entity}
                    onCheckedChange={() => set("entidadeSolicitadora", form.entidadeSolicitadora === entity ? "" : entity)}
                  />
                  <label htmlFor={`entity-${entity}`} className="ml-2 text-sm cursor-pointer">{entity}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Ref. Filedoc</Label>
            <Input placeholder="Referência do Filedoc" value={form.refFiledoc} onChange={(e) => set("refFiledoc", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">E-mail</Label>
            <Input placeholder="E-mail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Ordem Verbal</Label>
            <Input placeholder="Ordem Verbal" value={form.ordemVerbal} onChange={(e) => set("ordemVerbal", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
        </div>
      </Section>

        {/* POC e Despacho */}
      <Section>
        <SectionTitle icon={<User className="w-4 h-4" />} title="POC e Despacho" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Posto/Função</Label>
            <Input placeholder="Ex: Sargento" value={form.pocPosto} onChange={(e) => set("pocPosto", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Nome</Label>
            <Input placeholder="Nome completo" value={form.pocNome} onChange={(e) => set("pocNome", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Contacto</Label>
            <Input placeholder="Telefone/Email" value={form.pocContacto} onChange={(e) => set("pocContacto", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
        </div>
        <div className="mb-4">
          <Label className="text-sm font-semibold text-gray-600 mb-1 block">Despacho</Label>
          <Textarea placeholder="Registo do despacho..." value={form.despacho} onChange={(e) => set("despacho", e.target.value)} className="min-h-[80px] border-2 focus:border-[#1a472a]" />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-600 mb-1 block">Comando Territorial (CTer) Requerente</Label>
          <Select value={form.cterRequerente} onValueChange={(v) => set("cterRequerente", v)}>
            <SelectTrigger className="border-2 focus:border-[#1a472a]"><SelectValue placeholder="Selecione um CTer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CT Aveiro">CT Aveiro</SelectItem>
              <SelectItem value="CT Beja">CT Beja</SelectItem>
              <SelectItem value="CT Braga">CT Braga</SelectItem>
              <SelectItem value="CT Bragança">CT Bragança</SelectItem>
              <SelectItem value="CT Castelo Branco">CT Castelo Branco</SelectItem>
              <SelectItem value="CT Coimbra">CT Coimbra</SelectItem>
              <SelectItem value="CT Évora">CT Évora</SelectItem>
              <SelectItem value="CT Faro">CT Faro</SelectItem>
              <SelectItem value="CT Guarda">CT Guarda</SelectItem>
              <SelectItem value="CT Leiria">CT Leiria</SelectItem>
              <SelectItem value="CT Lisboa">CT Lisboa</SelectItem>
              <SelectItem value="CT Portalegre">CT Portalegre</SelectItem>
              <SelectItem value="CT Porto">CT Porto</SelectItem>
              <SelectItem value="CT Santarém">CT Santarém</SelectItem>
              <SelectItem value="CT Setúbal">CT Setúbal</SelectItem>
              <SelectItem value="CT Viana do Castelo">CT Viana do Castelo</SelectItem>
              <SelectItem value="CT Vila Real">CT Vila Real</SelectItem>
              <SelectItem value="CT Viseu">CT Viseu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Suspeitos */}
      <Section>
        <SectionTitle icon={<AlertTriangle className="w-4 h-4" />} title="Suspeito(s)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Mandados</Label>
            <CheckItem id="mandadoDetencao" label="Mandado de detenção (+5)" checked={form.mandadoDetencao} onCheckedChange={(v) => set("mandadoDetencao", v as boolean)} />
            <CheckItem id="mandadoBusca" label="Mandado de busca (+3)" checked={form.mandadoBusca} onCheckedChange={(v) => set("mandadoBusca", v as boolean)} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Quantidade de suspeitos</Label>
            <Select value={form.quantidadeSuspeitos} onValueChange={(v) => set("quantidadeSuspeitos", v)}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 suspeito (+1)</SelectItem>
                <SelectItem value="2">2 suspeitos (+2)</SelectItem>
                <SelectItem value="3">3 suspeitos (+4)</SelectItem>
                <SelectItem value="4+">4+ suspeitos (+6)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-t pt-6">
          <SuspectForm suspects={suspects} onSuspectsChange={setSuspects} />
        </div>
      </Section>

      {/* Atividade Criminal */}
      <Section>
        <SectionTitle icon={<Crosshair className="w-4 h-4" />} title="Atividade Criminal" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Modalidade</Label>
            <CheckItem id="isolado" label="Isolado (+2)" checked={form.modalidadeIsolado}
              onCheckedChange={(v) => { set("modalidadeIsolado", v as boolean); if (v) set("modalidadeAssociacao", false); }} />
            <CheckItem id="associacao" label="Associação criminosa (+8)" checked={form.modalidadeAssociacao}
              onCheckedChange={(v) => { set("modalidadeAssociacao", v as boolean); if (v) set("modalidadeIsolado", false); }} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Tipo de atividade</Label>
            <div className="space-y-2">
              <CheckItem id="trafico" label="Tráfico de droga (+7)" checked={form.tipoCriminal.includes("trafico")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "trafico"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "trafico"));
              }} />
              <CheckItem id="assalto" label="Assalto/Roubo (+6)" checked={form.tipoCriminal.includes("assalto")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "assalto"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "assalto"));
              }} />
              <CheckItem id="homicidio" label="Homicídio (+10)" checked={form.tipoCriminal.includes("homicidio")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "homicidio"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "homicidio"));
              }} />
              <CheckItem id="sequestro" label="Sequestro (+9)" checked={form.tipoCriminal.includes("sequestro")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "sequestro"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "sequestro"));
              }} />
              <CheckItem id="violencia" label="Violência grave (+8)" checked={form.tipoCriminal.includes("violencia")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "violencia"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "violencia"));
              }} />
              <CheckItem id="outro" label="Outro (+4)" checked={form.tipoCriminal.includes("outro")} onCheckedChange={(v) => {
                if (v) set("tipoCriminal", [...form.tipoCriminal, "outro"]);
                else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "outro"));
              }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Antecedentes criminais</Label>
            <CheckItem id="contraPessoas" label="Contra pessoas (+8)" checked={form.antecedentesContraPessoas} onCheckedChange={(v) => set("antecedentesContraPessoas", v as boolean)} />
            <CheckItem id="contraPatrimonio" label="Contra o património (+5)" checked={form.antecedentesContraPatrimonio} onCheckedChange={(v) => set("antecedentesContraPatrimonio", v as boolean)} />
            <CheckItem id="outrosAntecedentes" label="Outros (+3)" checked={form.antecedentesOutros} onCheckedChange={(v) => set("antecedentesOutros", v as boolean)} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Antecedentes contra FSS</Label>
            <RadioGroup value={form.antecedentesFSS} onValueChange={(v) => set("antecedentesFSS", v)} className="gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sim" id="fssSim" className="border-[#1a472a] text-[#1a472a]" />
                <label htmlFor="fssSim" className="text-sm cursor-pointer text-gray-700">Sim (+9)</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="nao" id="fssNao" className="border-[#1a472a] text-[#1a472a]" />
                <label htmlFor="fssNao" className="text-sm cursor-pointer text-gray-700">Não</label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Section>

      {/* Meios */}
      <Section>
        <SectionTitle icon={<Crosshair className="w-4 h-4" />} title="Meios" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Posse de arma de fogo</Label>
            <Select value={form.posseArma} onValueChange={(v) => set("posseArma", v)}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="registada">Registada (+8)</SelectItem>
                <SelectItem value="provavel">Provável (+6)</SelectItem>
                <SelectItem value="improvavel">Improvável (+2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Uso efetivo de arma de fogo</Label>
            <Select value={form.usoArma} onValueChange={(v) => set("usoArma", v)}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="haRegisto">Há registo (+10)</SelectItem>
                <SelectItem value="naoHaRegisto">Não há registo (+3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Local */}
      <Section>
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Local" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Tipologia</Label>
            <CheckItem id="apartamento" label="Apartamento (+3)" checked={form.tipologiaApartamento}
              onCheckedChange={(v) => { set("tipologiaApartamento", v as boolean); if (v) { set("tipologiaMoradia", false); set("tipologiaOutro", false); } }} />
            <CheckItem id="moradia" label="Moradia (+4)" checked={form.tipologiaMoradia}
              onCheckedChange={(v) => { set("tipologiaMoradia", v as boolean); if (v) { set("tipologiaApartamento", false); set("tipologiaOutro", false); } }} />
            <CheckItem id="outroLocal" label="Outro (+5)" checked={form.tipologiaOutro}
              onCheckedChange={(v) => { set("tipologiaOutro", v as boolean); if (v) { set("tipologiaApartamento", false); set("tipologiaMoradia", false); } }} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Contexto</Label>
            <CheckItem id="isoladoLocal" label="Isolado (+2)" checked={form.contextoIsolado} onCheckedChange={(v) => set("contextoIsolado", v as boolean)} />
            <CheckItem id="bairroSocial" label="Bairro social (+7)" checked={form.contextoBairroSocial} onCheckedChange={(v) => set("contextoBairroSocial", v as boolean)} />
            <CheckItem id="meioUrbano" label="Meio urbano (+5)" checked={form.contextoMeioUrbano} onCheckedChange={(v) => set("contextoMeioUrbano", v as boolean)} />
            <CheckItem id="meioRural" label="Meio rural (+3)" checked={form.contextoMeioRural} onCheckedChange={(v) => set("contextoMeioRural", v as boolean)} />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Características de segurança</Label>
            <CheckItem id="caes" label="Cães (+4)" checked={form.segurancaCaes} onCheckedChange={(v) => set("segurancaCaes", v as boolean)} />
            <CheckItem id="portaBlindada" label="Porta blindada (+6)" checked={form.segurancaPortaBlindada} onCheckedChange={(v) => set("segurancaPortaBlindada", v as boolean)} />
            <CheckItem id="outrasMedidas" label="Outras medidas (+5)" checked={form.segurancaOutrasMedidas} onCheckedChange={(v) => set("segurancaOutrasMedidas", v as boolean)} />
          </div>
        </div>
      </Section>

      {/* Observações após Local */}
      <Section>
        <div>
          <Label className="text-sm font-semibold text-gray-600 mb-1 block">Observações</Label>
          <Textarea placeholder="Registe aqui observações sobre o local..." value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} className="min-h-[80px] border-2 focus:border-[#1a472a]" />
        </div>
      </Section>

      {/* Avaliação */}
      <Section>
        <SectionTitle icon={<ClipboardList className="w-4 h-4" />} title="Avaliação" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Avaliador (Posto/Nome)</Label>
            <Input placeholder="Posto e nome do avaliador" value={form.avaliador} onChange={(e) => set("avaliador", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Data</Label>
            <Input type="date" value={form.dataAvaliacao} onChange={(e) => set("dataAvaliacao", e.target.value)} className="border-2 focus:border-[#1a472a]" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">NEOP Manual (Sobrescrever)</Label>
            <Select value={form.neopManual} onValueChange={(v) => set("neopManual", v)}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]">
                <SelectValue placeholder="Usar NEOP calculado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2º NEOP">2º NEOP</SelectItem>
                <SelectItem value="3º NEOP">3º NEOP</SelectItem>
                <SelectItem value="4º NEOP">4º NEOP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-600 mb-1 block">Outras Observações</Label>
          <Textarea placeholder="Registe aqui outras observações..." value={form.outrasObservacoes} onChange={(e) => set("outrasObservacoes", e.target.value)} className="min-h-[80px] border-2 focus:border-[#1a472a]" />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-600 mb-1 block">Parecer</Label>
          <Textarea placeholder="Registe aqui o seu parecer..." value={form.parecer} onChange={(e) => set("parecer", e.target.value)} className="min-h-[80px] border-2 focus:border-[#1a472a]" />
        </div>
      </Section>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-white text-center py-5 px-4 rounded-xl" style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}>
          <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Pontuação Total</p>
          <p className="text-4xl font-bold">{pontuacao}<span className="text-xl font-normal opacity-70">/100</span></p>
        </div>
        <div className="text-white text-center py-5 px-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${neopColorFromCalc} 0%, ${neopColorFromCalc}cc 100%)` }}>
          <p className="text-xs uppercase tracking-widest opacity-80 mb-1">Classificação Recomendada</p>
          <p className="text-3xl font-bold">{neop}</p>
        </div>
      </div>

      {/* Complexity Bar */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Grau de Complexidade</p>
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{
            background: neop === "4º NEOP" ? "#fee2e2" : neop === "3º NEOP" ? "#fef3c7" : "#dcfce7",
            color: neop === "4º NEOP" ? "#991b1b" : neop === "3º NEOP" ? "#92400e" : "#166534"
          }}>
            {complexidade}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: neop === "4º NEOP" ? "100%" : neop === "3º NEOP" ? "66%" : "33%",
              background: neop === "4º NEOP" ? "#dc2626" : neop === "3º NEOP" ? "#f59e0b" : "#22c55e"
            }}
          />
        </div>
        <p className="text-sm text-gray-600">{descricao}</p>
      </div>

      <Button
        className="w-full py-6 text-base font-bold"
        style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
        onClick={() => setShowConfirm(true)}
      >
        <Save className="w-5 h-5 mr-2" />
        Guardar Avaliação
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: "#1a472a" }}>Confirmar Submissão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-3">Tem a certeza que deseja guardar esta avaliação?</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 border border-gray-200">
            <p><strong>POC:</strong> {form.pocNome || "—"}</p>
            <p><strong>Avaliador:</strong> {form.avaliador || "—"}</p>
            <p><strong>Data:</strong> {form.dataAvaliacao}</p>
            <p><strong>Pontuação:</strong> {pontuacao}/100</p>
            <p><strong>NEOP:</strong> <span className="font-bold" style={{ color: neopColorFromCalc }}>{neop}</span></p>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate({
                nuipc: form.nuipc,
                entidadeSolicitadora: form.entidadeSolicitadora,
                refFiledoc: form.refFiledoc,
                email: form.email,
                ordemVerbal: form.ordemVerbal,
                pocPosto: form.pocPosto,
                pocNome: form.pocNome,
                pocContacto: form.pocContacto,
                despacho: form.despacho,
                parecer: form.cterRequerente ? `[${form.cterRequerente}] ${form.parecer}` : form.parecer,
                mandadoDetencao: form.mandadoDetencao ? 1 : 0,
                mandadoBusca: form.mandadoBusca ? 1 : 0,
                modalidadeIsolado: form.modalidadeIsolado ? 1 : 0,
                modalidadeAssociacao: form.modalidadeAssociacao ? 1 : 0,
                antecedentesContraPessoas: form.antecedentesContraPessoas ? 1 : 0,
                antecedentesContraPatrimonio: form.antecedentesContraPatrimonio ? 1 : 0,
                antecedentesOutros: form.antecedentesOutros ? 1 : 0,
                tipologiaApartamento: form.tipologiaApartamento ? 1 : 0,
                tipologiaMoradia: form.tipologiaMoradia ? 1 : 0,
                tipologiaOutro: form.tipologiaOutro ? 1 : 0,
                contextoIsolado: form.contextoIsolado ? 1 : 0,
                contextoBairroSocial: form.contextoBairroSocial ? 1 : 0,
                contextoMeioUrbano: form.contextoMeioUrbano ? 1 : 0,
                contextoMeioRural: form.contextoMeioRural ? 1 : 0,
                segurancaCaes: form.segurancaCaes ? 1 : 0,
                segurancaPortaBlindada: form.segurancaPortaBlindada ? 1 : 0,
                segurancaOutrasMedidas: form.segurancaOutrasMedidas ? 1 : 0,
                quantidadeSuspeitos: form.quantidadeSuspeitos,
                tipoCriminal: form.tipoCriminal.join(","),
                antecedentesFSS: form.antecedentesFSS,
                posseArma: form.posseArma,
                usoArma: form.usoArma,
                avaliador: form.avaliador,
                dataAvaliacao: form.dataAvaliacao,
                neopManual: form.neopManual || "",
                observacoes: form.observacoes,
                outrasObservacoes: form.outrasObservacoes,
              })}
              disabled={createMutation.isPending}
              style={{ background: "#1a472a" }}
            >
              {createMutation.isPending ? "A guardar..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
