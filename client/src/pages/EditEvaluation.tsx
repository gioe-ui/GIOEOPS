import { useState, useEffect, useCallback } from "react";
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
import { Loader2, ArrowLeft, Save, FileText } from "lucide-react";
import { SuspectForm, Suspect } from "@/components/SuspectForm";

const TIPO_SCORES: Record<string, number> = {
  trafico: 7, assalto: 6, homicidio: 10, sequestro: 9, violencia: 8, outro: 4,
};
const POSSE_SCORES: Record<string, number> = { registada: 8, provavel: 6, improvavel: 2 };
const USO_SCORES: Record<string, number> = { haRegisto: 10, naoHaRegisto: 3 };
const QTD_SCORES: Record<string, number> = { "1": 1, "2": 2, "3": 4, "4+": 6 };

type FormState = {
  nuipc: string; entidadeSolicitadora: string; refFiledoc: string; email: string; ordemVerbal: string;
  pocPosto: string; pocNome: string; pocContacto: string; despacho: string;
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
  observacoes: string; outrasObservacoes: string;
  avaliador: string; dataAvaliacao: string; parecer: string; neopManual: string;
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
  
  if (f.neopManual && ["2º NEOP", "3º NEOP", "4º NEOP"].includes(f.neopManual)) {
    let neop = f.neopManual;
    let complexidade = "Baixa";
    let descricao = "Operação de rotina - Procedimentos padrão";
    let neopColor = "#22c55e";
    if (neop === "3º NEOP") {
      complexidade = "Média";
      descricao = "Operação com risco moderado - Requer coordenação";
      neopColor = "#f97316";
    } else if (neop === "4º NEOP") {
      complexidade = "Alta";
      descricao = "Necessita de planeamento especializado";
      neopColor = "#ef4444";
    }
    return { pontuacao, neop, complexidade, descricao, neopColor };
  }
  
  let neop = pontuacao <= 25 ? "2º NEOP" : pontuacao <= 75 ? "3º NEOP" : "4º NEOP";
  const temAssociacaoCriminosa = f.modalidadeAssociacao;
  const temArmaRegistada = f.posseArma === "registada";
  const temArmaProbavel = f.posseArma === "provavel";
  const temUsoArma = f.usoArma === "haRegisto";
  const temAntecedentesContraFSS = f.antecedentesFSS === "sim";
  const temCrimeGrave = f.tipoCriminal.some(tipo => ["homicidio", "sequestro", "violencia"].includes(tipo));
  
  if (temAssociacaoCriminosa && (temArmaRegistada || temArmaProbavel)) {
    neop = "4º NEOP";
  }
  if (temUsoArma && temAntecedentesContraFSS) {
    neop = "4º NEOP";
  }
  if (temCrimeGrave && temUsoArma) {
    neop = "4º NEOP";
  }
  
  let complexidade = neop === "2º NEOP" ? "Baixa" : neop === "3º NEOP" ? "Média" : "Alta";
  let descricao = neop === "2º NEOP" ? "Operação de rotina - Procedimentos padrão" : neop === "3º NEOP" ? "Operação com risco moderado - Requer coordenação" : "Necessita de planeamento especializado";
  let neopColor = neop === "2º NEOP" ? "#22c55e" : neop === "3º NEOP" ? "#f97316" : "#ef4444";
  
  return { pontuacao, neop, complexidade, descricao, neopColor };
}

export default function EditEvaluation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [suspects, setSuspects] = useState<Suspect[]>([]);

  const { data: evaluation, isLoading } = trpc.evaluations.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  const { data: suspectsList } = trpc.suspects.getByEvaluationId.useQuery(
    { evaluationId: parseInt(id || "0") },
    { enabled: !!id }
  );

  const suspectsMutation = trpc.suspects.createBatch.useMutation();
  const suspectsDeleteMutation = trpc.suspects.deleteByEvaluationId.useMutation();

  const updateMutation = trpc.evaluations.update.useMutation({
    onSuccess: () => {
      // Atualizar suspeitos de forma sequencial
      if (id) {
        const evaluationId = parseInt(id);
        // Primeiro deletar suspeitos antigos
        suspectsDeleteMutation.mutateAsync({ evaluationId }).then(() => {
          // Depois criar novos suspeitos
          if (suspects.length > 0) {
            suspectsMutation.mutateAsync({
              evaluationId,
              suspects: suspects.map(s => ({
                nome: s.nome,
                dataNascimento: s.dataNascimento,
                nacionalidade: s.nacionalidade,
                nif: s.nif,
                cc: s.cc,
                morada: s.morada,
                observacoes: s.observacoes,
              })),
            }).then(() => {
              toast.success("Avaliação guardada com sucesso!");
              navigate("/");
            }).catch((error) => {
              toast.error(`Erro ao guardar suspeitos: ${error.message}`);
            });
          } else {
            toast.success("Avaliação guardada com sucesso!");
            navigate("/");
          }
        }).catch((error) => {
          toast.error(`Erro ao deletar suspeitos: ${error.message}`);
        });
      } else {
        toast.success("Avaliação guardada com sucesso!");
        navigate("/");
      }
    },
    onError: (error) => {
      toast.error(`Erro ao guardar: ${error.message}`);
    },
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
        mandadoDetencao: evaluation.mandadoDetencao === 1,
        mandadoBusca: evaluation.mandadoBusca === 1,
        quantidadeSuspeitos: evaluation.quantidadeSuspeitos || "1",
        modalidadeIsolado: evaluation.modalidadeIsolado === 1,
        modalidadeAssociacao: evaluation.modalidadeAssociacao === 1,
        tipoCriminal: (evaluation.tipoCriminal || "outro").split(",").filter(Boolean),
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
        observacoes: (evaluation as any).observacoes || "",
        outrasObservacoes: (evaluation as any).outrasObservacoes || "",
        avaliador: evaluation.avaliador || "",
        dataAvaliacao: evaluation.dataAvaliacao || new Date().toISOString().split("T")[0],
        parecer: evaluation.parecer || "",
        neopManual: "",
      });
    }
  }, [evaluation, form]);

  useEffect(() => {
    if (suspectsList) {
      setSuspects(suspectsList.map(s => ({
        id: s.id,
        nome: s.nome || "",
        dataNascimento: s.dataNascimento || "",
        nacionalidade: s.nacionalidade || "",
        nif: s.nif || "",
        cc: s.cc || "",
        morada: s.morada || "",
        observacoes: s.observacoes || "",
      })));
    }
  }, [suspectsList]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : null);
  }, []);

  const handleSave = async () => {
    if (!form || !id) return;
    try {
      setIsSaving(true);
      // Guardar a avaliação e os suspeitos
      await updateMutation.mutateAsync({
        id: parseInt(id),
        ...form,
        tipoCriminal: form.tipoCriminal.join(","),
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
        observacoes: form.observacoes,
        outrasObservacoes: form.outrasObservacoes,
        neopManual: form.neopManual || "",
      });
    } catch (error) {
      console.error("Erro ao guardar:", error);
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

  const { pontuacao, neop, complexidade, neopColor } = calcScore(form);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
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
          <div className="flex gap-2">
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
            <Button
              onClick={() => navigate(`/print/${id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>

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

        <div className="bg-white p-6 rounded-lg space-y-6">
          {/* Informação Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informação Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">NUIPC</Label>
                <Input value={form.nuipc} onChange={(e) => set("nuipc", e.target.value)} placeholder="NUIPC" />
              </div>
              <div>
                <Label className="block mb-2">Entidade Solicitadora</Label>
                <Input value={form.entidadeSolicitadora} onChange={(e) => set("entidadeSolicitadora", e.target.value)} placeholder="Entidade" />
              </div>
              <div>
                <Label className="block mb-2">Ref. Filedoc</Label>
                <Input value={form.refFiledoc} onChange={(e) => set("refFiledoc", e.target.value)} placeholder="Ref. Filedoc" />
              </div>
              <div>
                <Label className="block mb-2">Email</Label>
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" />
              </div>
              <div>
                <Label className="block mb-2">Ordem Verbal</Label>
                <Input value={form.ordemVerbal} onChange={(e) => set("ordemVerbal", e.target.value)} placeholder="Ordem Verbal" />
              </div>
              <div>
                <Label className="block mb-2">Despacho</Label>
                <Input value={form.despacho} onChange={(e) => set("despacho", e.target.value)} placeholder="Despacho" />
              </div>
            </div>
          </div>

          {/* Ponto de Contacto */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ponto de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block mb-2">Posto</Label>
                <Input value={form.pocPosto} onChange={(e) => set("pocPosto", e.target.value)} placeholder="Posto" />
              </div>
              <div>
                <Label className="block mb-2">Nome</Label>
                <Input value={form.pocNome} onChange={(e) => set("pocNome", e.target.value)} placeholder="Nome" />
              </div>
              <div>
                <Label className="block mb-2">Contacto</Label>
                <Input value={form.pocContacto} onChange={(e) => set("pocContacto", e.target.value)} placeholder="Contacto" />
              </div>
            </div>
          </div>

          {/* Mandados */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mandados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.mandadoDetencao} onCheckedChange={(v) => set("mandadoDetencao", !!v)} />
                <Label>Mandado de Detenção</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.mandadoBusca} onCheckedChange={(v) => set("mandadoBusca", !!v)} />
                <Label>Mandado de Busca</Label>
              </div>
            </div>
          </div>

          {/* Atividade Criminal */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Criminal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Tipo de Crime</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="trafico" checked={form.tipoCriminal.includes("trafico")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "trafico"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "trafico"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="trafico" className="text-sm cursor-pointer text-gray-700">Tráfico (+7)</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="assalto" checked={form.tipoCriminal.includes("assalto")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "assalto"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "assalto"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="assalto" className="text-sm cursor-pointer text-gray-700">Assalto/Roubo (+6)</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="homicidio" checked={form.tipoCriminal.includes("homicidio")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "homicidio"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "homicidio"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="homicidio" className="text-sm cursor-pointer text-gray-700">Homicídio (+10)</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="sequestro" checked={form.tipoCriminal.includes("sequestro")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "sequestro"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "sequestro"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="sequestro" className="text-sm cursor-pointer text-gray-700">Sequestro (+9)</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="violencia" checked={form.tipoCriminal.includes("violencia")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "violencia"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "violencia"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="violencia" className="text-sm cursor-pointer text-gray-700">Violência grave (+8)</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Checkbox id="outro" checked={form.tipoCriminal.includes("outro")} onCheckedChange={(v) => {
                      if (v) set("tipoCriminal", [...form.tipoCriminal, "outro"]);
                      else set("tipoCriminal", form.tipoCriminal.filter(t => t !== "outro"));
                    }} className="data-[state=checked]:bg-[#1a472a] data-[state=checked]:border-[#1a472a]" />
                    <label htmlFor="outro" className="text-sm cursor-pointer text-gray-700">Outro (+4)</label>
                  </div>
                </div>
              </div>
              <div>
                <Label className="block mb-2">Quantidade de Suspeitos</Label>
                <Select value={form.quantidadeSuspeitos} onValueChange={(v) => set("quantidadeSuspeitos", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 suspeito</SelectItem>
                    <SelectItem value="2">2 suspeitos</SelectItem>
                    <SelectItem value="3">3 suspeitos</SelectItem>
                    <SelectItem value="4+">4+ suspeitos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Identificação de Suspeito(s)</h3>
              <SuspectForm suspects={suspects} onSuspectsChange={setSuspects} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.modalidadeIsolado} onCheckedChange={(v) => set("modalidadeIsolado", !!v)} />
                <Label>Modalidade Isolado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.modalidadeAssociacao} onCheckedChange={(v) => set("modalidadeAssociacao", !!v)} />
                <Label>Associação Criminosa</Label>
              </div>
            </div>
          </div>

          {/* Antecedentes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Antecedentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.antecedentesContraPessoas} onCheckedChange={(v) => set("antecedentesContraPessoas", !!v)} />
                <Label>Contra Pessoas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.antecedentesContraPatrimonio} onCheckedChange={(v) => set("antecedentesContraPatrimonio", !!v)} />
                <Label>Contra Património</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.antecedentesOutros} onCheckedChange={(v) => set("antecedentesOutros", !!v)} />
                <Label>Outros</Label>
              </div>
              <div>
                <Label className="block mb-2">Antecedentes FSS</Label>
                <Select value={form.antecedentesFSS} onValueChange={(v) => set("antecedentesFSS", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Meios */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Meios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Posse de Arma</Label>
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
                <Label className="block mb-2">Uso de Arma</Label>
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
          </div>

          {/* Tipologia */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipologia</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.tipologiaApartamento} onCheckedChange={(v) => set("tipologiaApartamento", !!v)} />
                <Label>Apartamento</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.tipologiaMoradia} onCheckedChange={(v) => set("tipologiaMoradia", !!v)} />
                <Label>Moradia</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.tipologiaOutro} onCheckedChange={(v) => set("tipologiaOutro", !!v)} />
                <Label>Outro</Label>
              </div>
            </div>
          </div>

          {/* Contexto */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contexto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.contextoIsolado} onCheckedChange={(v) => set("contextoIsolado", !!v)} />
                <Label>Isolado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.contextoBairroSocial} onCheckedChange={(v) => set("contextoBairroSocial", !!v)} />
                <Label>Bairro Social</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.contextoMeioUrbano} onCheckedChange={(v) => set("contextoMeioUrbano", !!v)} />
                <Label>Meio Urbano</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.contextoMeioRural} onCheckedChange={(v) => set("contextoMeioRural", !!v)} />
                <Label>Meio Rural</Label>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.segurancaCaes} onCheckedChange={(v) => set("segurancaCaes", !!v)} />
                <Label>Cães</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.segurancaPortaBlindada} onCheckedChange={(v) => set("segurancaPortaBlindada", !!v)} />
                <Label>Porta Blindada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.segurancaOutrasMedidas} onCheckedChange={(v) => set("segurancaOutrasMedidas", !!v)} />
                <Label>Outras Medidas</Label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="block mb-2">Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Registe aqui observações sobre o local..."
              rows={3}
            />
          </div>

          {/* Avaliador e Data */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informação da Avaliação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">Avaliador</Label>
                <Input value={form.avaliador} onChange={(e) => set("avaliador", e.target.value)} placeholder="Avaliador" />
              </div>
              <div>
                <Label className="block mb-2">Data da Avaliação</Label>
                <Input type="date" value={form.dataAvaliacao} onChange={(e) => set("dataAvaliacao", e.target.value)} />
              </div>
            </div>
          </div>

          {/* NEOP Manual */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">NEOP Manual (Opcional)</h2>
            <Select value={form.neopManual || "none"} onValueChange={(v) => set("neopManual", v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sem seleção (usar calculado)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem seleção (usar calculado)</SelectItem>
                <SelectItem value="2º NEOP">2º NEOP</SelectItem>
                <SelectItem value="3º NEOP">3º NEOP</SelectItem>
                <SelectItem value="4º NEOP">4º NEOP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outras Observações */}
          <div>
            <Label className="block mb-2">Outras Observações</Label>
            <Textarea
              value={form.outrasObservacoes}
              onChange={(e) => set("outrasObservacoes", e.target.value)}
              placeholder="Registe aqui outras observações..."
              rows={3}
            />
          </div>

          {/* Parecer */}
          <div>
            <Label className="block mb-2">Parecer</Label>
            <Textarea
              value={form.parecer}
              onChange={(e) => set("parecer", e.target.value)}
              placeholder="Parecer da avaliação"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
