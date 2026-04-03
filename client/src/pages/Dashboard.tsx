import { useState } from "react";
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
import { Download, Trash2, Search } from "lucide-react";

const NEOP_COLORS: Record<string, string> = {
  "2º NEOP": "#1a472a",
  "3º NEOP": "#b8860b",
  "4º NEOP": "#8b0000",
};

export default function Dashboard() {
  const [filterNeop, setFilterNeop] = useState("all");
  const [filterAvaliador, setFilterAvaliador] = useState("");
  const [avaliadorInput, setAvaliadorInput] = useState("");
  const utils = trpc.useUtils();

  const { data: evaluations, isLoading } = trpc.evaluations.list.useQuery({
    neop: filterNeop === "all" ? undefined : filterNeop,
    avaliador: filterAvaliador || undefined,
  });

  const deleteMutation = trpc.evaluations.delete.useMutation({
    onSuccess: () => {
      toast.success("Avaliação eliminada.");
      utils.evaluations.list.invalidate();
      utils.statistics.get.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta avaliação?")) {
      deleteMutation.mutate({ id });
    }
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
        Parecer: e.parecer,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avaliações");
    XLSX.writeFile(wb, "avaliacoes_GIOE.xlsx");
  };

  const applyFilter = () => setFilterAvaliador(avaliadorInput);

  return (
    <div className="max-w-6xl mx-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                {["Data", "POC", "Pontuação", "NEOP", "Avaliador", "Ação"].map((h) => (
                  <th key={h} className="text-white text-left px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e, i) => (
                <tr
                  key={e.id}
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
                  <td className="px-4 py-3">
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
    </div>
  );
}
