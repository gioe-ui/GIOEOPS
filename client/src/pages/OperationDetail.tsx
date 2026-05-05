import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Save, FileDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

export function OperationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: operation, isLoading } = trpc.operations.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id && id !== undefined }
  );

  const updateMutation = trpc.operations.update.useMutation();

  // Carregar dados da operação quando disponível
  useEffect(() => {
    if (operation) {
      setForm(operation);
    }
  }, [operation]);

  const handleInputChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!id) throw new Error("Operation ID is required");
      
      // Calcular status de preenchimento
      const hasOperacaoData = form.cterOperacao || form.dterOperacao || form.pterZaOperacao || form.gdhInicioOperacao;
      const hasConsumos = form.municoesArmasAuto762 > 0 || form.municoesArmasAuto9mm > 0 || form.taserCargaX26 > 0;
      const hasObservacoes = form.obsSECOp || form.apontamentosNotas;
      
      const operacaoPreenchida = hasOperacaoData ? 1 : 0;
      const consumosPreenchidos = hasConsumos ? 1 : 0;
      const observacoesPreenchidas = hasObservacoes ? 1 : 0;
      
      await updateMutation.mutateAsync({
        id: parseInt(id),
        ...form,
        operacaoPreenchida,
        consumosPreenchidos,
        observacoesPreenchidas,
      });
      toast.success("Operação guardada com sucesso!");
    } catch (error) {
      toast.error("Erro ao guardar operação");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleGeneratePDF = async () => {
    try {
      const printElement = document.getElementById("print-operation-content");
      if (!printElement) {
        toast.error("Nenhum registo de operação encontrado.");
        return;
      }

      const html2pdf = (await import("html2pdf.js")).default;
      const element = printElement.cloneNode(true) as HTMLElement;
      
      // Remover elementos não desejados
      element.querySelectorAll("button, [style*='display: none']").forEach(el => el.remove());
      
      const opt = {
        margin: 10,
        filename: `operacao_${operation?.operacaoNumero || "sem_numero"}.pdf`,
        image: { type: "png" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: "portrait" as const, unit: "mm", format: "a4" },
      };
      
      html2pdf().set(opt).from(element).save();
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Operação não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Operação {operation.operacaoNumero || "Sem número"}
            </h1>
          </div>
          <Button
            onClick={handleGeneratePDF}
            disabled={isSaving}
            variant="outline"
            className="border-green-700 text-green-700 hover:bg-green-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
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

        {/* Tabs */}
        <Tabs defaultValue="referencia" className="bg-white rounded-lg shadow">
          <TabsList className="w-full justify-start border-b rounded-none bg-gray-50 p-0">
            <TabsTrigger
              value="referencia"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-700"
            >
              Referência
            </TabsTrigger>
            <TabsTrigger
              value="reuniao"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-700"
            >
              Reunião Coordenação
            </TabsTrigger>
            <TabsTrigger
              value="operacao"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-700"
            >
              Dados Operação
            </TabsTrigger>
            <TabsTrigger
              value="consumos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-700"
            >
              Consumos
            </TabsTrigger>
            <TabsTrigger
              value="observacoes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-700"
            >
              Observações
            </TabsTrigger>
          </TabsList>

          {/* Referência */}
          <TabsContent value="referencia" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ref. Filedoc</Label>
                <Input
                  value={form.refFiledoc || ""}
                  onChange={(e) => handleInputChange("refFiledoc", e.target.value)}
                  placeholder="Referência do Filedoc"
                />
              </div>
              <div className="space-y-2">
                <Label>Número da Operação</Label>
                <Input
                  value={form.operacaoNumero || ""}
                  onChange={(e) => handleInputChange("operacaoNumero", e.target.value)}
                  placeholder="Número da operação"
                />
              </div>
              <div className="space-y-2">
                <Label>Preenchimento SEC Op</Label>
                <Input
                  value={form.preenchimentoSecOp || ""}
                  onChange={(e) => handleInputChange("preenchimentoSecOp", e.target.value)}
                  placeholder="Preenchimento SEC Op"
                />
              </div>
              <div className="space-y-2">
                <Label>Cmdt Op</Label>
                <Input
                  value={form.cmdtOp || ""}
                  onChange={(e) => handleInputChange("cmdtOp", e.target.value)}
                  placeholder="Comandante da operação"
                />
              </div>
              <div className="space-y-2">
                <Label>Data da Operação</Label>
                <Input
                  type="date"
                  value={form.dataOp || ""}
                  onChange={(e) => handleInputChange("dataOp", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Empenho</Label>
                <Input
                  value={form.tipoEmpenho || ""}
                  onChange={(e) => handleInputChange("tipoEmpenho", e.target.value)}
                  placeholder="Tipo de empenho"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Missão</Label>
              <Textarea
                value={form.missao || ""}
                onChange={(e) => handleInputChange("missao", e.target.value)}
                placeholder="Descrição da missão"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Entidade Solicitadora</Label>
              <Input
                value={form.entidadeSolicitadora || ""}
                onChange={(e) => handleInputChange("entidadeSolicitadora", e.target.value)}
                placeholder="Entidade solicitadora"
              />
            </div>
          </TabsContent>

          {/* Reunião Coordenação */}
          <TabsContent value="reuniao" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={form.local || ""}
                  onChange={(e) => handleInputChange("local", e.target.value)}
                  placeholder="Local da reunião"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Saída UI</Label>
                <Input
                  value={form.gdhSaidaUI || ""}
                  onChange={(e) => handleInputChange("gdhSaidaUI", e.target.value)}
                  placeholder="GDH Saída UI"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Entrada UI</Label>
                <Input
                  value={form.gdhEntradaUI || ""}
                  onChange={(e) => handleInputChange("gdhEntradaUI", e.target.value)}
                  placeholder="GDH Entrada UI"
                />
              </div>
              <div className="space-y-2">
                <Label>Cmdt Força Reunião</Label>
                <Input
                  value={form.cmdtForcaReuniao || ""}
                  onChange={(e) => handleInputChange("cmdtForcaReuniao", e.target.value)}
                  placeholder="Comandante da força"
                />
              </div>
              <div className="space-y-2">
                <Label>Indicativo Rádio</Label>
                <Input
                  value={form.indicativoRadioReuniao || ""}
                  onChange={(e) => handleInputChange("indicativoRadioReuniao", e.target.value)}
                  placeholder="Indicativo rádio"
                />
              </div>
              <div className="space-y-2">
                <Label>Efetivo Total</Label>
                <Input
                  value={form.efetivTotalReuniao || ""}
                  onChange={(e) => handleInputChange("efetivTotalReuniao", e.target.value)}
                  placeholder="Efetivo total"
                />
              </div>
              <div className="space-y-2">
                <Label>Viaturas Caracterizadas</Label>
                <Input
                  type="number"
                  value={form.viaturasCaracterizadasReuniao || 0}
                  onChange={(e) => handleInputChange("viaturasCaracterizadasReuniao", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Viaturas Descaracterizadas</Label>
                <Input
                  type="number"
                  value={form.viaturasDescaracterizadasReuniao || 0}
                  onChange={(e) => handleInputChange("viaturasDescaracterizadasReuniao", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Viaturas Especiais</Label>
                <Input
                  type="number"
                  value={form.viaturasEspeciaisReuniao || 0}
                  onChange={(e) => handleInputChange("viaturasEspeciaisReuniao", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>KM Totais</Label>
                <Input
                  value={form.kmTotaisReuniao || ""}
                  onChange={(e) => handleInputChange("kmTotaisReuniao", e.target.value)}
                  placeholder="KM totais"
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label>Observações Reunião</Label>
              <Textarea
                value={form.obsReuniao || ""}
                onChange={(e) => handleInputChange("obsReuniao", e.target.value)}
                placeholder="Observações da reunião"
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Dados Operação */}
          <TabsContent value="operacao" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTer Operação</Label>
                <Input
                  value={form.cterOperacao || ""}
                  onChange={(e) => handleInputChange("cterOperacao", e.target.value)}
                  placeholder="CTer da operação"
                />
              </div>
              <div className="space-y-2">
                <Label>DTer Operação</Label>
                <Input
                  value={form.dterOperacao || ""}
                  onChange={(e) => handleInputChange("dterOperacao", e.target.value)}
                  placeholder="DTer da operação"
                />
              </div>
              <div className="space-y-2">
                <Label>PTer/ZA Operação</Label>
                <Input
                  value={form.pterZaOperacao || ""}
                  onChange={(e) => handleInputChange("pterZaOperacao", e.target.value)}
                  placeholder="PTer/ZA da operação"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Início Operação</Label>
                <Input
                  value={form.gdhInicioOperacao || ""}
                  onChange={(e) => handleInputChange("gdhInicioOperacao", e.target.value)}
                  placeholder="GDH Início"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Chegada UI</Label>
                <Input
                  value={form.gdhChegadaUIOperacao || ""}
                  onChange={(e) => handleInputChange("gdhChegadaUIOperacao", e.target.value)}
                  placeholder="GDH Chegada UI"
                />
              </div>
              <div className="space-y-2">
                <Label>Cmdt Força Operação</Label>
                <Input
                  value={form.cmdtForcaOperacao || ""}
                  onChange={(e) => handleInputChange("cmdtForcaOperacao", e.target.value)}
                  placeholder="Comandante da força"
                />
              </div>
              <div className="space-y-2">
                <Label>Indicativo Rádio</Label>
                <Input
                  value={form.indicativoRadioOperacao || ""}
                  onChange={(e) => handleInputChange("indicativoRadioOperacao", e.target.value)}
                  placeholder="Indicativo rádio"
                />
              </div>
              <div className="space-y-2">
                <Label>Efetivo Total</Label>
                <Input
                  value={form.efetivTotalOperacao || ""}
                  onChange={(e) => handleInputChange("efetivTotalOperacao", e.target.value)}
                  placeholder="Efetivo total"
                />
              </div>
              <div className="space-y-2">
                <Label>ITP Tipo</Label>
                <Input
                  value={form.itpTipo || ""}
                  onChange={(e) => handleInputChange("itpTipo", e.target.value)}
                  placeholder="Tipo de ITP"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Início ITP</Label>
                <Input
                  value={form.gdhInicioITP || ""}
                  onChange={(e) => handleInputChange("gdhInicioITP", e.target.value)}
                  placeholder="GDH Início ITP"
                />
              </div>
              <div className="space-y-2">
                <Label>GDH Fim ITP</Label>
                <Input
                  value={form.gdhFimITP || ""}
                  onChange={(e) => handleInputChange("gdhFimITP", e.target.value)}
                  placeholder="GDH Fim ITP"
                />
              </div>
              <div className="space-y-2">
                <Label>Força Titular Inquéritos</Label>
                <Input
                  type="number"
                  value={form.forcaTitularInqueritos || 0}
                  onChange={(e) => handleInputChange("forcaTitularInqueritos", parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custos Portagens</Label>
                <Textarea
                  value={form.custosPortagens || ""}
                  onChange={(e) => handleInputChange("custosPortagens", e.target.value)}
                  placeholder="Custos de portagens"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Custos Combustíveis</Label>
                <Textarea
                  value={form.custosCombustiveis || ""}
                  onChange={(e) => handleInputChange("custosCombustiveis", e.target.value)}
                  placeholder="Custos de combustíveis"
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label>Obs Visados</Label>
              <Textarea
                value={form.obsVisados || ""}
                onChange={(e) => handleInputChange("obsVisados", e.target.value)}
                placeholder="Observações sobre visados"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Consumos */}
          <TabsContent value="consumos" className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Munições Armas Auto 7.62</Label>
                <Input
                  type="number"
                  value={form.municoesArmasAuto762 || 0}
                  onChange={(e) => handleInputChange("municoesArmasAuto762", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Armas Auto 9mm</Label>
                <Input
                  type="number"
                  value={form.municoesArmasAuto9mm || 0}
                  onChange={(e) => handleInputChange("municoesArmasAuto9mm", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Armas Auto 7.62mm</Label>
                <Input
                  type="number"
                  value={form.municoesArmasAuto762mm || 0}
                  onChange={(e) => handleInputChange("municoesArmasAuto762mm", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Armas Auto 5.56mm</Label>
                <Input
                  type="number"
                  value={form.municoesArmasAuto556mm || 0}
                  onChange={(e) => handleInputChange("municoesArmasAuto556mm", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Armas Auto 5.56</Label>
                <Input
                  type="number"
                  value={form.municoesArmasAuto556 || 0}
                  onChange={(e) => handleInputChange("municoesArmasAuto556", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Caçadeira Barraca</Label>
                <Input
                  type="number"
                  value={form.municoesCacadeiraBarracha || 0}
                  onChange={(e) => handleInputChange("municoesCacadeiraBarracha", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Caçadeira Chumbo</Label>
                <Input
                  type="number"
                  value={form.municoesCacadeiraChumbo || 0}
                  onChange={(e) => handleInputChange("municoesCacadeiraChumbo", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Caçadeira Bean Bag</Label>
                <Input
                  type="number"
                  value={form.municoesCacadeiraBeamBag || 0}
                  onChange={(e) => handleInputChange("municoesCacadeiraBeamBag", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Caçadeira Zagalote</Label>
                <Input
                  type="number"
                  value={form.municoesCacadeiraZagalote || 0}
                  onChange={(e) => handleInputChange("municoesCacadeiraZagalote", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Caçadeira Zinco</Label>
                <Input
                  type="number"
                  value={form.municoesCacadeiraZinco || 0}
                  onChange={(e) => handleInputChange("municoesCacadeiraZinco", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Munições Revolver ASP</Label>
                <Input
                  type="number"
                  value={form.municoesRevolverASP || 0}
                  onChange={(e) => handleInputChange("municoesRevolverASP", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taser Carga X26</Label>
                <Input
                  type="number"
                  value={form.taserCargaX26 || 0}
                  onChange={(e) => handleInputChange("taserCargaX26", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taser Granada FlashBang 1 Estalo</Label>
                <Input
                  type="number"
                  value={form.taserGranadaFlashBang1Estalo || 0}
                  onChange={(e) => handleInputChange("taserGranadaFlashBang1Estalo", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taser Granada FlashBang 1 Estalo 2 Bang</Label>
                <Input
                  type="number"
                  value={form.taserGranadaFlashBang1Estalo2Bang || 0}
                  onChange={(e) => handleInputChange("taserGranadaFlashBang1Estalo2Bang", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taser Granada FlashBang 2 Estalos 2 Bangs</Label>
                <Input
                  type="number"
                  value={form.taserGranadaFlashBang2Estalos2Bangs || 0}
                  onChange={(e) => handleInputChange("taserGranadaFlashBang2Estalos2Bangs", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taser Granada FlashBang Múltiplos</Label>
                <Input
                  type="number"
                  value={form.taserGranadaFlashBangMultiplos || 0}
                  onChange={(e) => handleInputChange("taserGranadaFlashBangMultiplos", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Algemas ASP</Label>
                <Input
                  value={form.taserAlgemas || ""}
                  onChange={(e) => handleInputChange("taserAlgemas", e.target.value)}
                  placeholder="Taser algemas"
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label>Observações Consumos</Label>
              <Textarea
                value={form.obsConsumos || ""}
                onChange={(e) => handleInputChange("obsConsumos", e.target.value)}
                placeholder="Observações sobre consumos"
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Observações */}
          <TabsContent value="observacoes" className="p-6 space-y-4">
            <div className="space-y-2">
                <Label>Obs SEC Op</Label>
              <Textarea
                value={form.obsSECOp || ""}
                onChange={(e) => handleInputChange("obsSECOp", e.target.value)}
                placeholder="Observações SEC Op"
                rows={4}
              />
            </div>
            <div className="space-y-2">
                <Label>Reg SEC Op</Label>
              <Input
                value={form.regSECOp || ""}
                onChange={(e) => handleInputChange("regSECOp", e.target.value)}
                placeholder="Registo SEC Op"
              />
            </div>
            <div className="space-y-2">
                <Label>Apontamentos/Notas</Label>
              <Textarea
                value={form.apontamentosNotas || ""}
                onChange={(e) => handleInputChange("apontamentosNotas", e.target.value)}
                placeholder="Apontamentos e notas"
                rows={4}
              />
            </div>
            <div className="space-y-2">
                <Label>Croquis</Label>
              <Textarea
                value={form.croquis || ""}
                onChange={(e) => handleInputChange("croquis", e.target.value)}
                placeholder="Descrição do croquis"
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
