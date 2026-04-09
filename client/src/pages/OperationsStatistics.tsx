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

      // Cabeçalhos da primeira linha (títulos de secção)
      const headerRow = [
        "ID Op ",
        "",
        "LOCALIZAÇÃO TEMPORAL",
        "",
        "",
        "",
        "EFETIVO",
        "",
        "",
        "",
        "",
        "",
        "LOGISTICA",
        "",
        "ÁREA OPERAÇÕES",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "RESULTADOS",
        "",
        "",
        "",
        "OBSERVAÇÕES",
      ];

      // Cabeçalhos da segunda linha (nomes das colunas)
      const subHeaderRow = [
        "Nº Op",
        "Atividade\n(VER LEGENDA ABAIXO)",
        "Mês",
        "Inicio",
        "Fim",
        "Horas",
        "Destacamento",
        "Cmdt Força\nGIOE",
        "Of's",
        "Sarg's",
        "Grd's",
        "Total",
        "Viaturas",
        "KM",
        "CTer",
        "DTer",
        "Área Operações",
        "Entidade Requisitante\n(CO - CTer - PSP - PJ ...)",
        "Força Titular do Inquérito",
        "Custos Combustíveis\n(€)",
        "Custos Portagens\n(€)",
        "Observações Visados\n(Visado Alertado / Não Residente / De 2 só estava 1 / Etc.)",
        "Armas",
        "Detidos",
        "Feridos",
        "Mortos",
        "",
      ];

      const data = operations.map((op, idx) => {
        // Extrair mês do campo dataOp
        let mes = "";
        if (op.dataOp) {
          const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
          const mesNum = parseInt(op.dataOp.substring(2, 4));
          mes = meses[mesNum - 1] || "";
        }
        
        return [
          idx,
          op.preenchimentoSecOp || "",
          mes,
          op.gdhSaidaUI || "",
          op.gdhEntradaUI || "",
          op.efetivTotalReuniao || "",
          op.cmdtForcaReuniao || "",
          op.cmdtOp || "",
          "",  // Of's
          "",  // Sarg's
          "",  // Grd's
          op.efetivTotalOperacao || "",
          op.viaturasCaracterizadasOperacao || "",
          op.kmTotaisOperacao || "",
          op.cterOperacao || "",
          op.dterOperacao || "",
          op.pterZaOperacao || "",
          op.entidadeSolicitadora || "",
          op.forcaTitularInqueritos || "",
          op.custosCombustiveis || "",
          op.custosPortagens || "",
          op.obsVisados || "",
          "",  // Armas
          "",  // Detidos
          "",  // Feridos
          "",  // Mortos
          op.apontamentosNotas || "",
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headerRow, subHeaderRow, ...data.map(row => row)]);
      
      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 8 },   // Nº Op
        { wch: 20 },  // Atividade
        { wch: 8 },   // Mês
        { wch: 12 },  // Inicio
        { wch: 12 },  // Fim
        { wch: 8 },   // Horas
        { wch: 15 },  // Destacamento
        { wch: 15 },  // Cmdt Força
        { wch: 6 },   // Of's
        { wch: 8 },   // Sarg's
        { wch: 8 },   // Grd's
        { wch: 8 },   // Total
        { wch: 10 },  // Viaturas
        { wch: 8 },   // KM
        { wch: 12 },  // CTer
        { wch: 12 },  // DTer
        { wch: 15 },  // Área Operações
        { wch: 20 },  // Entidade Requisitante
        { wch: 20 },  // Força Titular
        { wch: 12 },  // Custos Combustíveis
        { wch: 12 },  // Custos Portagens
        { wch: 30 },  // Observações Visados
        { wch: 8 },   // Armas
        { wch: 8 },   // Detidos
        { wch: 8 },   // Feridos
        { wch: 8 },   // Mortos
        { wch: 30 },  // Observações
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reg. Operações 2025");
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
            style={{ background: "#1a472a" }}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar para Excel"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4 items-center">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
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

        {someSelected && (
          <Button
            onClick={handleDeleteSelected}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Selecionadas ({selectedIds.size})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : !operations || operations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhuma operação encontrada
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr style={{ background: "#1a472a", color: "white" }}>
                <th className="border border-gray-300 p-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="border border-gray-300 p-2 text-left">Nº Op</th>
                <th className="border border-gray-300 p-2 text-left">Atividade</th>
                <th className="border border-gray-300 p-2 text-left">Mês</th>
                <th className="border border-gray-300 p-2 text-left">Inicio</th>
                <th className="border border-gray-300 p-2 text-left">Fim</th>
                <th className="border border-gray-300 p-2 text-left">Horas</th>
                <th className="border border-gray-300 p-2 text-left">Cmdt Força</th>
                <th className="border border-gray-300 p-2 text-left">Total</th>
                <th className="border border-gray-300 p-2 text-left">Viaturas</th>
                <th className="border border-gray-300 p-2 text-left">KM</th>
                <th className="border border-gray-300 p-2 text-left">CTer</th>
                <th className="border border-gray-300 p-2 text-left">DTer</th>
                <th className="border border-gray-300 p-2 text-left">Entidade</th>
                <th className="border border-gray-300 p-2 text-left">Custos Comb.</th>
                <th className="border border-gray-300 p-2 text-left">Custos Port.</th>
                <th className="border border-gray-300 p-2 text-left">Observações</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr
                  key={op.id}
                  className={selectedIds.has(op.id) ? "bg-blue-100" : "hover:bg-gray-50"}
                >
                  <td className="border border-gray-300 p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(op.id)}
                      onChange={(e) => handleSelectOne(op.id, e.target.checked)}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">{op.operacaoNumero || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.preenchimentoSecOp || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.dataOp ? op.dataOp.substring(2, 5) : "-"}</td>
                  <td className="border border-gray-300 p-2">{op.gdhSaidaUI || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.gdhEntradaUI || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.efetivTotalReuniao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.cmdtOp || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.efetivTotalOperacao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.viaturasCaracterizadasOperacao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.kmTotaisOperacao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.cterOperacao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.dterOperacao || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.entidadeSolicitadora || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.custosCombustiveis || "-"}</td>
                  <td className="border border-gray-300 p-2">{op.custosPortagens || "-"}</td>
                  <td className="border border-gray-300 p-2 text-sm">{op.apontamentosNotas || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar {selectedIds.size} operação(ões)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              style={{ background: "#dc2626" }}
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
