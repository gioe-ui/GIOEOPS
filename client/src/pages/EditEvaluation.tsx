import { useParams, useLocation } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ChangeEvent } from "react";

// ─── Scoring ─────────────────────────────────────────────────────────────────
const TIPO_SCORES: Record<string, number> = {
  trafico: 7, assalto: 6, homicidio: 10, sequestro: 9, violencia: 8, outro: 4,
};
const POSSE_SCORES: Record<string, number> = { registada: 8, provavel: 6, improvavel: 2 };
const USO_SCORES: Record<string, number> = { haRegisto: 10, naoHaRegisto: 3 };
const QTD_SCORES: Record<string, number> = { "1": 1, "2": 2, "3": 4, "4+": 6 };

type FormState = {
  nuipc: string; entidadeSolicitadora: string; refFiledoc: string; email: string; ordemVerbal: string;
  pocPosto: string; pocNome: string; pocContacto: string; despacho: string; cterRequerente: string;
  mandadoDetencao: boolean; mandadoBusca: boolean;
  quantidadeSuspeitos: string;
  modalidadeIsolado: boolean; modalidadeAssociacao: boolean;
  tipoCriminal: string;
  antecedentesContraPessoas: boolean; antecedentesContraPatrimonio: boolean; antecedentesOutros: boolean;
  antecedentesFSS: string;
  posseArma: string; usoArma: string;
  tipologiaApartamento: boolean; tipologiaMoradia: boolean; tipologiaOutro: boolean;
  contextoIsolado: boolean; contextoBairroSocial: boolean; contextoMeioUrbano: boolean; contextoMeioRural: boolean;
  segurancaCaes: boolean; segurancaPortaBlindada: boolean; segurancaOutrasMedidas: boolean;
  avaliador: string; dataAvaliacao: string; parecer: string;
};

function calcScore(f: FormState): { pontuacao: number; neop: string; complexidade: string; descricao: string; neopColor: string } {
  let s = 0;
  if (f.mandadoDetencao) s += 5;
  if (f.mandadoBusca) s += 3;
  s += QTD_SCORES[f.quantidadeSuspeitos] ?? 1;
  if (f.modalidadeIsolado) s += 2;
  if (f.modalidadeAssociacao) s += 8;
  s += TIPO_SCORES[f.tipoCriminal] ?? 4;
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
  const temAntecedentesContraFSS = f.antecedentesFSS === "sim";
  const temCrimeGrave = ["homicidio", "sequestro", "violencia"].includes(f.tipoCriminal);
  
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

export default function EditEvaluation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: evaluation, isLoading } = trpc.evaluations.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  const updateMutation = trpc.evaluations.update.useMutation({
    onSuccess: () => {
      toast.success("Avaliação atualizada com sucesso!");
      navigate("/");
    },
    onError: (e: any) => toast.error("Erro ao atualizar: " + e.message),
  });

  useEffect(() => {
    if (evaluation && !form) {
      setForm({
        nuipc: evaluation.nuipc || "",
        entidadeSolicitadora: evaluation.entidadeSolicitadora || "",
        refFiledoc: evaluation.refFiledoc || "",
        email: evaluation.email || "",
        ordemVerbal: evaluation.ordemVerbal || "",
        pocPosto: evaluation.pocPosto || "",
        pocNome: evaluation.pocNome || "",
        pocContacto: evaluation.pocContacto || "",
        despacho: evaluation.despacho || "",
        cterRequerente: "",
        mandadoDetencao: evaluation.mandadoDetencao === 1,
        mandadoBusca: evaluation.mandadoBusca === 1,
        quantidadeSuspeitos: evaluation.quantidadeSuspeitos || "1",
        modalidadeIsolado: evaluation.modalidadeIsolado === 1,
        modalidadeAssociacao: evaluation.modalidadeAssociacao === 1,
        tipoCriminal: evaluation.tipoCriminal || "outro",
        antecedentesContraPessoas: evaluation.antecedentesContraPessoas === 1,
        antecedentesContraPatrimonio: evaluation.antecedentesContraPatrimonio === 1,
        antecedentesOutros: evaluation.antecedentesOutros === 1,
        antecedentesFSS: evaluation.antecedentesFSS || "nao",
        posseArma: evaluation.posseArma || "improvavel",
        usoArma: evaluation.usoArma || "naoHaRegisto",
        tipologiaApartamento: evaluation.tipologiaApartamento === 1,
        tipologiaMoradia: evaluation.tipologiaMoradia === 1,
        tipologiaOutro: evaluation.tipologiaOutro === 1,
        contextoIsolado: evaluation.contextoIsolado === 1,
        contextoBairroSocial: evaluation.contextoBairroSocial === 1,
        contextoMeioUrbano: evaluation.contextoMeioUrbano === 1,
        contextoMeioRural: evaluation.contextoMeioRural === 1,
        segurancaCaes: evaluation.segurancaCaes === 1,
        segurancaPortaBlindada: evaluation.segurancaPortaBlindada === 1,
        segurancaOutrasMedidas: evaluation.segurancaOutrasMedidas === 1,
        avaliador: evaluation.avaliador || "",
        dataAvaliacao: evaluation.dataAvaliacao || new Date().toISOString().split("T")[0],
        parecer: evaluation.parecer || "",
      });
    }
  }, [evaluation, form]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : null);
  }, []);

  const handleSave = async () => {
    if (!form || !id) return;
    try {
      setIsSaving(true);
      const { pontuacao, neop } = calcScore(form);
      await updateMutation.mutateAsync({
        id: parseInt(id),
        ...form,
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
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Avaliação não encontrada</p>
      </div>
    );
  }

  const { pontuacao, neop, complexidade, descricao, neopColor } = calcScore(form);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Avaliação</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-700">
            <div className="text-sm text-gray-600">Pontuação</div>
            <div className="text-3xl font-bold text-green-700">{pontuacao}/100</div>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4" style={{ borderColor: neopColor }}>
            <div className="text-sm text-gray-600">NEOP</div>
            <div className="text-3xl font-bold" style={{ color: neopColor }}>{neop}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-700">
            <div className="text-sm text-gray-600">Complexidade</div>
            <div className="text-3xl font-bold text-blue-700">{complexidade}</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>NUIPC</Label>
              <Input
                value={form.nuipc}
                onChange={(e) => set("nuipc", e.target.value)}
                placeholder="NUIPC"
              />
            </div>
            <div>
              <Label>Tipo de Crime</Label>
              <Select value={form.tipoCriminal} onValueChange={(v) => set("tipoCriminal", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trafico">Tráfico</SelectItem>
                  <SelectItem value="assalto">Assalto</SelectItem>
                  <SelectItem value="homicidio">Homicídio</SelectItem>
                  <SelectItem value="sequestro">Sequestro</SelectItem>
                  <SelectItem value="violencia">Violência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Posse de Arma</Label>
              <Select value={form.posseArma} onValueChange={(v) => set("posseArma", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="improvavel">Improvável</SelectItem>
                  <SelectItem value="provavel">Provável</SelectItem>
                  <SelectItem value="registada">Registada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Uso de Arma</Label>
              <Select value={form.usoArma} onValueChange={(v) => set("usoArma", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naoHaRegisto">Não Há Registo</SelectItem>
                  <SelectItem value="haRegisto">Há Registo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.mandadoDetencao}
                onCheckedChange={(v) => set("mandadoDetencao", !!v)}
              />
              <Label>Mandado de Detenção</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.mandadoBusca}
                onCheckedChange={(v) => set("mandadoBusca", !!v)}
              />
              <Label>Mandado de Busca</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.modalidadeAssociacao}
                onCheckedChange={(v) => set("modalidadeAssociacao", !!v)}
              />
              <Label>Associação Criminosa</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.antecedentesContraPessoas}
                onCheckedChange={(v) => set("antecedentesContraPessoas", !!v)}
              />
              <Label>Antecedentes Contra Pessoas</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
