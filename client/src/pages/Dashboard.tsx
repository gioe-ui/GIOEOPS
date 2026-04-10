import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Trash2, Search, Printer, FileText, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const NEOP_COLORS: Record<string, string> = {
  "2º NEOP": "#1a472a",
  "3º NEOP": "#b8860b",
  "4º NEOP": "#8b0000",
};

const getStatusColor = (evaluation: any): { color: string; label: string } => {
  if (!evaluation.operationId) {
    return { color: "#dc2626", label: "Sem informação" };
  }
  
  if (!evaluation.operacaoPreenchida && !evaluation.consumosPreenchidos && !evaluation.observacoesPreenchidas) {
    return { color: "#dc2626", label: "Não iniciada" };
  }
  
  if (!evaluation.operacaoPreenchida || !evaluation.consumosPreenchidos || !evaluation.observacoesPreenchidas) {
    return { color: "#eab308", label: "Parcialmente preenchida" };
  }
  
  return { color: "#22c55e", label: "Completa" };
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [filterNeop, setFilterNeop] = useState("all");
  const [filterAvaliador, setFilterAvaliador] = useState("");
  const [avaliadorInput, setAvaliadorInput] = useState("");
  const [filterCter, setFilterCter] = useState("all");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [notificationSending, setNotificationSending] = useState(false);
  const utils = trpc.useUtils();

  const { data: evaluations, isLoading } = trpc.evaluations.list.useQuery({
    neop: filterNeop === "all" ? undefined : filterNeop,
    avaliador: filterAvaliador || undefined,
    cterRequerente: filterCter === "all" ? undefined : filterCter,
  });

  const { data: cters, isLoading: ctersLoading } = trpc.evaluations.getCters.useQuery();

  const deleteMutation = trpc.evaluations.delete.useMutation({
    onSuccess: () => {
      toast.success("Avaliação eliminada.");
      utils.evaluations.list.invalidate();
      utils.statistics.get.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const sendNotificationMutation = trpc.operations.sendNotification.useMutation({
    onSuccess: (result) => {
      toast.success("Notificação registada! Abra o WhatsApp para enviar a mensagem.");
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank");
      }
      setShowNotificationModal(false);
      setSelectedEvaluation(null);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar notificação: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta avaliação?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSendNotification = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setShowNotificationModal(true);
  };

  const confirmSendNotification = async () => {
    if (!selectedEvaluation) return;
    setNotificationSending(true);
    try {
      console.log("Sending notification with:", {
        operationId: selectedEvaluation.operationId,
        userId: selectedEvaluation.assignedUserId,
        phoneNumber: selectedEvaluation.assignedUserPhone,
      });
      await sendNotificationMutation.mutateAsync({
        operationId: selectedEvaluation.operationId,
        userId: selectedEvaluation.assignedUserId,
        phoneNumber: selectedEvaluation.assignedUserPhone || "",
        militarName: selectedEvaluation.assignedUserName || "Militar",
        scheduledDate: selectedEvaluation.scheduledDate || new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setNotificationSending(false);
    }
  };

  const extractCter = (parecer: string | null): string => {
    if (!parecer) return "—";
    const match = parecer.match(/CTer:\s*([^\n,]+)/i);
    return match ? match[1].trim() : "—";
  };

  const exportToExcel = async () => {
    if (!evaluations || evaluations.length === 0) {
      toast.error("Nenhuma avaliação para exportar.");
      return;
    }
    const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs" as any);
    const ws = XLSX.utils.json_to_sheet(
      evaluations.map((e) => ({
        Data: new Date(e.createdAt).toLocaleDateString("pt-PT"),
        POC: e.pocNome,
        Posto: e.pocPosto,
        Pontuação: e.pontuacao,
        NEOP: e.neop,
        Avaliador: e.avaliador,
        CTer: extractCter(e.parecer),
        Parecer: e.parecer,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaliações");
    XLSX.writeFile(wb, "avaliacoes_GIOE.xlsx");
  };

  const applyFilter = () => {
    setFilterAvaliador(avaliadorInput);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: "#1a472a" }}>
          Histórico de Avaliações
        </h2>
        <Button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar para Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Filtrar por NEOP</Label>
            <Select value={filterNeop} onValueChange={setFilterNeop}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="2º NEOP">2º NEOP</SelectItem>
                <SelectItem value="3º NEOP">3º NEOP</SelectItem>
                <SelectItem value="4º NEOP">4º NEOP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Filtrar por CTer</Label>
            <Select value={filterCter} onValueChange={setFilterCter}>
              <SelectTrigger className="border-2 focus:border-[#1a472a]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ctersLoading ? (
                  <SelectItem value="loading" disabled>
                    A carregar...
                  </SelectItem>
                ) : cters && cters.length > 0 ? (
                  cters.map((cter) => (
                    <SelectItem key={cter} value={cter}>
                      {cter}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum CTer encontrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600 mb-1 block">Filtrar por Avaliador</Label>
            <Input
              placeholder="Nome do avaliador"
              value={avaliadorInput}
              onChange={(e) => setAvaliadorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              className="border-2 focus:border-[#1a472a]"
            />
          </div>
          <Button onClick={applyFilter} style={{ background: "#1a472a" }}>
            <Search className="w-4 h-4 mr-2" />
            Pesquisar
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : !evaluations || evaluations.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a472a" }}>
                {["Data", "POC", "Pontuação", "NEOP", "Avaliador", "CTer", "Militar Atribuído", "Status", "Ação"].map((h) => (
                  <th key={h} className="text-white text-left px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e, i) => (
                <tr
                  key={`eval-${e.id}-op-${e.operationId || 'none'}`}
                  className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(e.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.pocNome || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold" style={{ color: "#1a472a" }}>
                      {e.pontuacao}
                    </span>
                    <span className="text-gray-400">/100</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-white text-xs font-bold"
                      style={{ background: NEOP_COLORS[e.neop] ?? "#1a472a" }}
                    >
                      {e.neop}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.avaliador || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{extractCter(e.parecer)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.assignedUserRank && e.assignedUserName
                      ? `${e.assignedUserRank} ${e.assignedUserName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.operationId ? (
                      <div className="flex items-center gap-2" title={getStatusColor(e).label}>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getStatusColor(e).color }}
                        />
                        <span className="text-xs text-gray-600">{getStatusColor(e).label}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {e.assignedUserId && e.assignedUserPhone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNotification(e)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Notificar
                      </Button>
                    )}
                    {e.neop === "4º NEOP" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/operation/${e.id}`)}
                          className="border-orange-600 text-orange-600 hover:bg-orange-50"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Operação
                        </Button>
                        {e.operationId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/operation-detail/${e.operationId}`)}
                            className="border-purple-600 text-purple-600 hover:bg-purple-50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(e.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {evaluations.length} avaliação(ões) encontrada(s)
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificar Militar por WhatsApp</DialogTitle>
            <DialogDescription>
              Envie uma notificação ao militar atribuído sobre a operação.
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Militar</Label>
                <p className="text-sm text-gray-600">
                  {selectedEvaluation.assignedUserRank} {selectedEvaluation.assignedUserName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Telefone</Label>
                <p className="text-sm text-gray-600">{selectedEvaluation.assignedUserPhone}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Data Prevista da Operação</Label>
                <p className="text-sm text-gray-600">
                  {selectedEvaluation.scheduledDate
                    ? new Date(selectedEvaluation.scheduledDate).toLocaleDateString("pt-PT")
                    : "Não definida"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Mensagem</Label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                  Operação atribuída: {selectedEvaluation.id}. Data prevista: {selectedEvaluation.scheduledDate ? new Date(selectedEvaluation.scheduledDate).toLocaleDateString("pt-PT") : "A definir"}. Por favor, confirme receção.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSendNotification}
              disabled={notificationSending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {notificationSending ? "A enviar..." : "Enviar no WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
