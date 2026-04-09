import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MONTHS_ORDER = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default function OperationsStatistics() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: months, isLoading: monthsLoading } = trpc.operations.getMonths.useQuery();
  const { data: operations, isLoading: operationsLoading, refetch } = trpc.operations.getByMonth.useQuery({
    month: selectedMonth === "all" ? undefined : selectedMonth,
  });

  const deleteMany = trpc.operations.deleteMany.useMutation({
    onSuccess: () => {
      toast.success("Operações eliminadas com sucesso!");
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao eliminar: ${error.message}`);
    },
  });

  const sortedMonths = useMemo(() => {
    if (!months) return [];
    return months.sort((a, b) => {
      const indexA = MONTHS_ORDER.indexOf(a);
      const indexB = MONTHS_ORDER.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [months]);

  const handleSelectAll = (checked: boolean) => {
    if (checked && operations) {
      setSelectedIds(new Set(operations.map(op => op.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos uma operação para eliminar.");
      return;
    }
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    await deleteMany.mutateAsync({ ids: Array.from(selectedIds) });
  };

  const exportToExcel = async () => {
    if (!operations || operations.length === 0) {
      toast.error("Nenhuma operação para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs" as any);

      const data = operations.map((op, idx) => ({
        "ID Op": idx,
        "Atividade (VER LEGENDA ABAIXO)": op.preenchimentoSecOp || "",
        "Mês": op.preenchimentoSecOp || "",
        "Inicio": op.gdhSaidaUI || "",
        "Fim": op.gdhEntradaUI || "",
        "Horas": op.efetivTotalReuniao || "",
        "Destacamento": op.cmdtForcaReuniao || "",
        "Cmdt Força GIOE": op.cmdtOp || "",
        "Of's": "",
        "Sarg's": "",
        "Grd's": "",
        "Total": op.efetivTotalOperacao || "",
        "Viaturas": op.viaturasCaracterizadasOperacao || 0,
        "KM": op.kmTotaisOperacao || "",
        "CTer": op.cterOperacao || "",
        "DTer": op.dterOperacao || "",
        "Área Operações": op.pterZaOperacao || "",
        "Entidade Requisitante (CO - CTer - PSP - PJ ...)": op.entidadeSolicitadora || "",
        "Força Titular do Inquérito": op.forcaTitularInqueritos || "",
        "Custos Combustíveis (€)": op.custosCombustiveis || "",
        "Custos Portagens (€)": op.custosPortagens || "",
        "Observações Visados": op.obsVisados || "",
        "Armas": "",
        "Detidos": "",
        "Feridos": "",
        "Mortos": "",
        "Observações": op.apontamentosNotas || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reg. Operações");
      XLSX.writeFile(wb, `operacoes_${selectedMonth === "all" ? "todas" : selectedMonth}_${new Date().getFullYear()}.xlsx`);
      toast.success("Ficheiro exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar ficheiro.");
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = monthsLoading || operationsLoading;
  const allSelected = operations && operations.length > 0 && selectedIds.size === operations.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: "#1a472a" }}>
          Operações - Estatística
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            disabled={isExporting || !operations || operations.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A exportar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar para Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtro de Mês */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Mês</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Selecione um mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {sortedMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão Eliminar (visível quando há seleção) */}
      {someSelected && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <span className="text-sm text-gray-700">
            {selectedIds.size} operação(ões) selecionada(s)
          </span>
          <Button
            onClick={handleDeleteSelected}
            disabled={deleteMany.isPending}
            className="bg-red-600 hover:bg-red-700 text-white ml-auto"
            size="sm"
          >
            {deleteMany.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A eliminar...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Selecionadas
              </>
            )}
          </Button>
        </div>
      )}

      {/* Tabela de Operações */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          A carregar...
        </div>
      ) : !operations || operations.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">Nenhuma operação encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1a472a" }}>
                <th className="text-white text-left px-3 py-3 font-semibold text-xs w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                {[
                  "Nº Op",
                  "Atividade",
                  "Mês",
                  "Início",
                  "Fim",
                  "Horas",
                  "Cmdt Força",
                  "Total Efetivo",
                  "Viaturas",
                  "KM",
                  "CTer",
                  "DTer",
                  "Área Op.",
                  "Entidade",
                  "Custos Comb.",
                  "Custos Port.",
                  "Observações",
                ].map((h) => (
                  <th key={h} className="text-white text-left px-3 py-3 font-semibold text-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operations.map((op, i) => (
                <tr
                  key={op.id}
                  className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  } ${selectedIds.has(op.id) ? "bg-blue-50" : ""}`}
                >
                  <td className="px-3 py-3 text-gray-600 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(op.id)}
                      onChange={(e) => handleSelectOne(op.id, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{i}</td>
                  <td className="px-3 py-3 text-gray-800 text-xs font-medium">{op.preenchimentoSecOp || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.preenchimentoSecOp || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.gdhSaidaUI || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.gdhEntradaUI || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.efetivTotalReuniao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.cmdtOp || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.efetivTotalOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.viaturasCaracterizadasOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.kmTotaisOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.cterOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.dterOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.pterZaOperacao || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.entidadeSolicitadora || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.custosCombustiveis || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs">{op.custosPortagens || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 text-xs truncate max-w-xs">{op.apontamentosNotas || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {operations.length} operação(ões) encontrada(s)
          </div>
        </div>
      )}

      {/* Dialog de Confirmação de Eliminação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar {selectedIds.size} operação(ões)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
