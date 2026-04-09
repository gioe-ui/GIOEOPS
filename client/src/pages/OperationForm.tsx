import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Printer, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FormState = {
  // Referência
  refFiledoc: string;
  operacaoNumero: string;
  preenchimentoSecOp: string;
  cmdtOp: string;
  dataOp: string;
  // Tipo Empenho
  tipoEmpenho: string;
  // Missão
  missao: string;
  // Entidade Solicitadora
  entidadeSolicitadora: string;
  // Dados Reunião Coordenação
  local: string;
  obsReuniao: string;
  gdhSaidaUI: string;
  gdhEntradaUI: string;
  cmdtForcaReuniao: string;
  indicativoRadioReuniao: string;
  efetivTotalReuniao: string;
  // Viaturas Reunião
  viaturasCaracterizadasReuniao: number;
  viaturasDescaracterizadasReuniao: number;
  viaturasEspeciaisReuniao: number;
  kmTotaisReuniao: string;
  // Dados Operação ITP
  cterOperacao: string;
  dterOperacao: string;
  pterZaOperacao: string;
  gdhInicioOperacao: string;
  gdhChegadaUIOperacao: string;
  cmdtForcaOperacao: string;
  indicativoRadioOperacao: string;
  efetivTotalOperacao: string;
  // Viaturas Operação
  viaturasCaracterizadasOperacao: number;
  viaturasDescaracterizadasOperacao: number;
  viaturasEspeciaisOperacao: number;
  kmTotaisOperacao: string;
  // Tempo Resolução ITP
  itpTipo: string;
  gdhInicioITP: string;
  gdhFimITP: string;
  // Força Titular do Inquérito
  forcaTitularInqueritos: number;
  custosPortagens: string;
  custosCombustiveis: string;
  obsVisados: string;
  // Consumos
  municoesArmasAuto762: number;
  municoesArmasAuto9mm: number;
  municoesArmasAuto762mm: number;
  municoesArmasAuto556mm: number;
  municoesArmasAuto556: number;
  municoesCacadeiraBarracha: number;
  municoesCacadeiraChumbo: number;
  municoesCacadeiraBeamBag: number;
  municoesCacadeiraZagalote: number;
  municoesCacadeiraZinco: number;
  municoesRevolverASP: number;
  taserCargaX26: number;
  taserGranadaFlashBang1Estalo: number;
  taserGranadaFlashBang1Estalo2Bang: number;
  taserGranadaFlashBang2Estalos2Bangs: number;
  taserGranadaFlashBangMultiplos: number;
  taserAlgemas: string;
  obsConsumos: string;
  // Observações
  obsSECOp: string;
  regSECOp: string;
  excelSECOp: boolean;
  apontamentosNotas: string;
  croquis: string;
};

export default function OperationForm() {
  const { evaluationId } = useParams();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [form, setForm] = useState<FormState>({
    refFiledoc: "",
    operacaoNumero: "",
    preenchimentoSecOp: "",
    cmdtOp: "",
    dataOp: "",
    tipoEmpenho: "",
    missao: "",
    entidadeSolicitadora: "",
    local: "",
    obsReuniao: "",
    gdhSaidaUI: "",
    gdhEntradaUI: "",
    cmdtForcaReuniao: "",
    indicativoRadioReuniao: "",
    efetivTotalReuniao: "",
    viaturasCaracterizadasReuniao: 0,
    viaturasDescaracterizadasReuniao: 0,
    viaturasEspeciaisReuniao: 0,
    kmTotaisReuniao: "",
    cterOperacao: "",
    dterOperacao: "",
    pterZaOperacao: "",
    gdhInicioOperacao: "",
    gdhChegadaUIOperacao: "",
    cmdtForcaOperacao: "",
    indicativoRadioOperacao: "",
    efetivTotalOperacao: "",
    viaturasCaracterizadasOperacao: 0,
    viaturasDescaracterizadasOperacao: 0,
    viaturasEspeciaisOperacao: 0,
    kmTotaisOperacao: "",
    itpTipo: "",
    gdhInicioITP: "",
    gdhFimITP: "",
    forcaTitularInqueritos: 0,
    custosPortagens: "",
    custosCombustiveis: "",
    obsVisados: "",
    municoesArmasAuto762: 0,
    municoesArmasAuto9mm: 0,
    municoesArmasAuto762mm: 0,
    municoesArmasAuto556mm: 0,
    municoesArmasAuto556: 0,
    municoesCacadeiraBarracha: 0,
    municoesCacadeiraChumbo: 0,
    municoesCacadeiraBeamBag: 0,
    municoesCacadeiraZagalote: 0,
    municoesCacadeiraZinco: 0,
    municoesRevolverASP: 0,
    taserCargaX26: 0,
    taserGranadaFlashBang1Estalo: 0,
    taserGranadaFlashBang1Estalo2Bang: 0,
    taserGranadaFlashBang2Estalos2Bangs: 0,
    taserGranadaFlashBangMultiplos: 0,
    taserAlgemas: "",
    obsConsumos: "",
    obsSECOp: "",
    regSECOp: "",
    excelSECOp: false,
    apontamentosNotas: "",
    croquis: "",
  });

  const createOperationMutation = trpc.operations.create.useMutation();

  const handleInputChange = useCallback((field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!evaluationId) {
      toast.error("ID de avaliação não encontrado");
      return;
    }

    setIsSaving(true);
    try {
      await createOperationMutation.mutateAsync({
        evaluationId: parseInt(evaluationId),
        ...form,
        excelSECOp: form.excelSECOp ? 1 : 0,
      });
      toast.success("Registo de operação guardado com sucesso!");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao guardar registo de operação");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: "#1a472a" }}>
              Registo de Dados da Operação
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isSaving}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              style={{ background: "#1a472a" }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Tabs defaultValue="referencia" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="referencia">Referência</TabsTrigger>
              <TabsTrigger value="reuniao">Dados Reunião Coordenação/Reconhecimento</TabsTrigger>
              <TabsTrigger value="operacao">Dados da Operação/ITP</TabsTrigger>
              <TabsTrigger value="consumos">Consumos</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
            </TabsList>

            {/* Referência Tab */}
            <TabsContent value="referencia" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ref. Filedoc/E-Mail/Ordem Verbal</Label>
                  <Input
                    value={form.refFiledoc}
                    onChange={(e) => handleInputChange("refFiledoc", e.target.value)}
                    placeholder="Referência"
                  />
                </div>
                <div>
                  <Label>Operação Nº</Label>
                  <Input
                    value={form.operacaoNumero}
                    onChange={(e) => handleInputChange("operacaoNumero", e.target.value)}
                    placeholder="Ex: 001/2024"
                  />
                </div>
                <div>
                  <Label>Preenchimento SECOp</Label>
                  <Input
                    value={form.preenchimentoSecOp}
                    onChange={(e) => handleInputChange("preenchimentoSecOp", e.target.value)}
                  />
                </div>
                <div>
                  <Label>CMDT Op</Label>
                  <Input
                    value={form.cmdtOp}
                    onChange={(e) => handleInputChange("cmdtOp", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Op</Label>
                  <Input
                    type="date"
                    value={form.dataOp}
                    onChange={(e) => handleInputChange("dataOp", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Tipo Empenho</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    "Intervenção Tática",
                    "Op. Segurança",
                    "Apoio",
                    "ITP",
                    "SIC UI",
                    "Exercício",
                    "Plastron",
                    "Demonstração",
                  ].map((tipo) => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.tipoEmpenho === tipo}
                        onCheckedChange={(checked) => {
                          if (checked) handleInputChange("tipoEmpenho", tipo);
                        }}
                      />
                      <span className="text-sm">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Missão</h3>
                <Textarea
                  value={form.missao}
                  onChange={(e) => handleInputChange("missao", e.target.value)}
                  placeholder="Descrição da missão"
                  rows={4}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Entidade Solicitadora</h3>
                <div className="grid grid-cols-3 gap-4">
                  {["CO", "CTer", "PSP", "PJ", "Outra"].map((entidade) => (
                    <label key={entidade} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.entidadeSolicitadora === entidade}
                        onCheckedChange={(checked) => {
                          if (checked) handleInputChange("entidadeSolicitadora", entidade);
                        }}
                      />
                      <span className="text-sm">{entidade}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Reunião Tab */}
            <TabsContent value="reuniao" className="space-y-6">
              <h3 className="font-bold text-lg">Dados Reunião Coordenação</h3>

              <div>
                <Label>Local</Label>
                <Textarea
                  value={form.local}
                  onChange={(e) => handleInputChange("local", e.target.value)}
                  placeholder="Local da reunião"
                  rows={3}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.obsReuniao}
                  onChange={(e) => handleInputChange("obsReuniao", e.target.value)}
                  placeholder="Observações"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GDH Saída UI</Label>
                  <Input
                    type="time"
                    value={form.gdhSaidaUI}
                    onChange={(e) => handleInputChange("gdhSaidaUI", e.target.value)}
                  />
                </div>
                <div>
                  <Label>GDH Entrada UI</Label>
                  <Input
                    type="time"
                    value={form.gdhEntradaUI}
                    onChange={(e) => handleInputChange("gdhEntradaUI", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>CMDT Força</Label>
                <Input
                  value={form.cmdtForcaReuniao}
                  onChange={(e) => handleInputChange("cmdtForcaReuniao", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Indicativo Rádio</Label>
                  <Input
                    value={form.indicativoRadioReuniao}
                    onChange={(e) => handleInputChange("indicativoRadioReuniao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Efetivo Total</Label>
                  <Input
                    type="number"
                    value={form.efetivTotalReuniao}
                    onChange={(e) => handleInputChange("efetivTotalReuniao", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Viaturas</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Caracterizadas</Label>
                    <Input
                      type="number"
                      value={form.viaturasCaracterizadasReuniao}
                      onChange={(e) => handleInputChange("viaturasCaracterizadasReuniao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Descaracterizadas</Label>
                    <Input
                      type="number"
                      value={form.viaturasDescaracterizadasReuniao}
                      onChange={(e) => handleInputChange("viaturasDescaracterizadasReuniao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Especiais</Label>
                    <Input
                      type="number"
                      value={form.viaturasEspeciaisReuniao}
                      onChange={(e) => handleInputChange("viaturasEspeciaisReuniao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Km Totais</Label>
                    <Input
                      value={form.kmTotaisReuniao}
                      onChange={(e) => handleInputChange("kmTotaisReuniao", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Operação Tab */}
            <TabsContent value="operacao" className="space-y-6">
              <h3 className="font-bold text-lg">Dados Operação ITP</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CTer</Label>
                  <Input
                    value={form.cterOperacao}
                    onChange={(e) => handleInputChange("cterOperacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>DTer</Label>
                  <Input
                    value={form.dterOperacao}
                    onChange={(e) => handleInputChange("dterOperacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>PTer/ZA</Label>
                  <Input
                    value={form.pterZaOperacao}
                    onChange={(e) => handleInputChange("pterZaOperacao", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GDH Início</Label>
                  <Input
                    type="time"
                    value={form.gdhInicioOperacao}
                    onChange={(e) => handleInputChange("gdhInicioOperacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>GDH Chegada UI</Label>
                  <Input
                    type="time"
                    value={form.gdhChegadaUIOperacao}
                    onChange={(e) => handleInputChange("gdhChegadaUIOperacao", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>CMDT Força</Label>
                <Input
                  value={form.cmdtForcaOperacao}
                  onChange={(e) => handleInputChange("cmdtForcaOperacao", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Indicativo Rádio</Label>
                  <Input
                    value={form.indicativoRadioOperacao}
                    onChange={(e) => handleInputChange("indicativoRadioOperacao", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Efetivo Total</Label>
                  <Input
                    type="number"
                    value={form.efetivTotalOperacao}
                    onChange={(e) => handleInputChange("efetivTotalOperacao", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Viaturas</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Caracterizadas</Label>
                    <Input
                      type="number"
                      value={form.viaturasCaracterizadasOperacao}
                      onChange={(e) => handleInputChange("viaturasCaracterizadasOperacao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Descaracterizadas</Label>
                    <Input
                      type="number"
                      value={form.viaturasDescaracterizadasOperacao}
                      onChange={(e) => handleInputChange("viaturasDescaracterizadasOperacao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Especiais</Label>
                    <Input
                      type="number"
                      value={form.viaturasEspeciaisOperacao}
                      onChange={(e) => handleInputChange("viaturasEspeciaisOperacao", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Km Totais</Label>
                    <Input
                      value={form.kmTotaisOperacao}
                      onChange={(e) => handleInputChange("kmTotaisOperacao", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Tempo Resolução ITP</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>ITP Tipo</Label>
                    <Input
                      value={form.itpTipo}
                      onChange={(e) => handleInputChange("itpTipo", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>GDH Início</Label>
                    <Input
                      type="time"
                      value={form.gdhInicioITP}
                      onChange={(e) => handleInputChange("gdhInicioITP", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>GDH Fim</Label>
                    <Input
                      type="time"
                      value={form.gdhFimITP}
                      onChange={(e) => handleInputChange("gdhFimITP", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold mb-4">Força Titular do Inquérito</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Número Visados Detidos</Label>
                    <Input
                      type="number"
                      value={form.forcaTitularInqueritos}
                      onChange={(e) => handleInputChange("forcaTitularInqueritos", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Custos Portagens</Label>
                    <Input
                      value={form.custosPortagens}
                      onChange={(e) => handleInputChange("custosPortagens", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Custos Combustíveis</Label>
                    <Input
                      value={form.custosCombustiveis}
                      onChange={(e) => handleInputChange("custosCombustiveis", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Observações Visados</Label>
                <Textarea
                  value={form.obsVisados}
                  onChange={(e) => handleInputChange("obsVisados", e.target.value)}
                  placeholder="Observações"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Consumos Tab */}
            <TabsContent value="consumos" className="space-y-6">
              <h3 className="font-bold text-lg">Consumos</h3>

              <div className="border-b pb-6">
                <h4 className="font-semibold mb-4">Munições Armas Auto</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>7.62mm</Label>
                    <Input
                      type="number"
                      value={form.municoesArmasAuto762}
                      onChange={(e) => handleInputChange("municoesArmasAuto762", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>9mm</Label>
                    <Input
                      type="number"
                      value={form.municoesArmasAuto9mm}
                      onChange={(e) => handleInputChange("municoesArmasAuto9mm", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>7.62mm (alt)</Label>
                    <Input
                      type="number"
                      value={form.municoesArmasAuto762mm}
                      onChange={(e) => handleInputChange("municoesArmasAuto762mm", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>5.56mm</Label>
                    <Input
                      type="number"
                      value={form.municoesArmasAuto556mm}
                      onChange={(e) => handleInputChange("municoesArmasAuto556mm", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>5.56</Label>
                    <Input
                      type="number"
                      value={form.municoesArmasAuto556}
                      onChange={(e) => handleInputChange("municoesArmasAuto556", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-6">
                <h4 className="font-semibold mb-4">Munições Caçadeira</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Barracha</Label>
                    <Input
                      type="number"
                      value={form.municoesCacadeiraBarracha}
                      onChange={(e) => handleInputChange("municoesCacadeiraBarracha", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Chumbo</Label>
                    <Input
                      type="number"
                      value={form.municoesCacadeiraChumbo}
                      onChange={(e) => handleInputChange("municoesCacadeiraChumbo", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Beam Bag</Label>
                    <Input
                      type="number"
                      value={form.municoesCacadeiraBeamBag}
                      onChange={(e) => handleInputChange("municoesCacadeiraBeamBag", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Zagalote</Label>
                    <Input
                      type="number"
                      value={form.municoesCacadeiraZagalote}
                      onChange={(e) => handleInputChange("municoesCacadeiraZagalote", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Zinco</Label>
                    <Input
                      type="number"
                      value={form.municoesCacadeiraZinco}
                      onChange={(e) => handleInputChange("municoesCacadeiraZinco", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-6">
                <h4 className="font-semibold mb-4">Munições Revólver / TASER</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Revólver ASP</Label>
                    <Input
                      type="number"
                      value={form.municoesRevolverASP}
                      onChange={(e) => handleInputChange("municoesRevolverASP", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>TASER Carga X26</Label>
                    <Input
                      type="number"
                      value={form.taserCargaX26}
                      onChange={(e) => handleInputChange("taserCargaX26", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b pb-6">
                <h4 className="font-semibold mb-4">Granadas Flash Bang</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>1 Estalo 1 Bang</Label>
                    <Input
                      type="number"
                      value={form.taserGranadaFlashBang1Estalo}
                      onChange={(e) => handleInputChange("taserGranadaFlashBang1Estalo", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>1 Estalo 2 Bang</Label>
                    <Input
                      type="number"
                      value={form.taserGranadaFlashBang1Estalo2Bang}
                      onChange={(e) => handleInputChange("taserGranadaFlashBang1Estalo2Bang", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>2 Estalos 2 Bangs</Label>
                    <Input
                      type="number"
                      value={form.taserGranadaFlashBang2Estalos2Bangs}
                      onChange={(e) => handleInputChange("taserGranadaFlashBang2Estalos2Bangs", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Múltiplos Bangs</Label>
                    <Input
                      type="number"
                      value={form.taserGranadaFlashBangMultiplos}
                      onChange={(e) => handleInputChange("taserGranadaFlashBangMultiplos", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Algemas</Label>
                <Input
                  value={form.taserAlgemas}
                  onChange={(e) => handleInputChange("taserAlgemas", e.target.value)}
                />
              </div>

              <div>
                <Label>Observações Consumos</Label>
                <Textarea
                  value={form.obsConsumos}
                  onChange={(e) => handleInputChange("obsConsumos", e.target.value)}
                  placeholder="Observações"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Observações Tab */}
            <TabsContent value="observacoes" className="space-y-6">
              <div>
                <Label>Observações SECOp</Label>
                <Textarea
                  value={form.obsSECOp}
                  onChange={(e) => handleInputChange("obsSECOp", e.target.value)}
                  placeholder="Observações"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reg. SECOp</Label>
                  <Input
                    value={form.regSECOp}
                    onChange={(e) => handleInputChange("regSECOp", e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.excelSECOp}
                      onCheckedChange={(checked) => handleInputChange("excelSECOp", checked)}
                    />
                    <span className="text-sm">Excel SECOp</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Apontamentos / Notas Relevantes</Label>
                <Textarea
                  value={form.apontamentosNotas}
                  onChange={(e) => handleInputChange("apontamentosNotas", e.target.value)}
                  placeholder="Apontamentos e notas"
                  rows={6}
                />
              </div>

              <div>
                <Label>Croquis</Label>
                <Textarea
                  value={form.croquis}
                  onChange={(e) => handleInputChange("croquis", e.target.value)}
                  placeholder="Descrição do croquis"
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
