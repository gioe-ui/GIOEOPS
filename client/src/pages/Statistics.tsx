import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PortugalMap from "@/components/PortugalMap";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

const NEOP_COLORS = ["#1a472a", "#b8860b", "#8b0000"];

// Coordenadas geográficas dos CTers (latitude, longitude)
const CTER_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "CT Aveiro": { lat: 40.64, lng: -8.65 },
  "CT Beja": { lat: 38.01, lng: -7.86 },
  "CT Braga": { lat: 41.55, lng: -8.43 },
  "CT Bragança": { lat: 41.81, lng: -6.76 },
  "CT Castelo Branco": { lat: 40.28, lng: -7.50 },
  "CT Coimbra": { lat: 40.28, lng: -8.49 },
  "CT Évora": { lat: 38.66, lng: -8.90 },
  "CT Faro": { lat: 37.02, lng: -7.93 },
  "CT Guarda": { lat: 40.54, lng: -7.27 },
  "CT Leiria": { lat: 39.74, lng: -8.81 },
  "CT Lisboa": { lat: 38.72, lng: -9.14 },
  "CT Portalegre": { lat: 39.30, lng: -7.43 },
  "CT Porto": { lat: 41.16, lng: -8.63 },
  "CT Santarém": { lat: 39.24, lng: -8.73 },
  "CT Setúbal": { lat: 38.52, lng: -8.89 },
  "CT Viana do Castelo": { lat: 41.70, lng: -8.83 },
  "CT Vila Real": { lat: 41.30, lng: -7.74 },
  "CT Viseu": { lat: 40.66, lng: -7.47 },
};

export default function Statistics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: stats, isLoading } = trpc.statistics.get.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: neop4ByCter } = trpc.statistics.neop4ByCter.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (isLoading) {
    return (
      <div className="text-center py-16 text-gray-400">A carregar estatísticas...</div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-gray-400">
        Sem dados disponíveis.
      </div>
    );
  }

  const neopData = [
    { name: "2º NEOP", value: stats.neop2 },
    { name: "3º NEOP", value: stats.neop3 },
    { name: "4º NEOP", value: stats.neop4 },
  ];

  const scoreData = [
    { range: "0–25", count: stats.score0_25 },
    { range: "26–50", count: stats.score26_50 },
    { range: "51–75", count: stats.score51_75 },
    { range: "76–100", count: stats.score76_100 },
  ];

  const statCards = [
    { label: "Total de Avaliações", value: stats.total },
    { label: "Pontuação Média", value: stats.avgScore.toFixed(1) },
    { label: "2º NEOP", value: stats.neop2 },
    { label: "3º NEOP", value: stats.neop3 },
    { label: "4º NEOP", value: stats.neop4 },
  ];

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg sm:text-xl font-bold mb-6" style={{ color: "#1a472a" }}>
        Estatísticas
      </h2>

      {/* Date Filters */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
          <div>
            <Label className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 block">Data Inicial</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-2 focus:border-[#1a472a] text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 block">Data Final</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-2 focus:border-[#1a472a] text-xs sm:text-sm"
            />
          </div>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="border-2 border-gray-300 hover:bg-gray-100 text-xs sm:text-sm w-full sm:w-auto"
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="text-white text-center py-3 sm:py-4 px-2 sm:px-3 rounded-lg sm:rounded-xl"
            style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
          >
            <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-80 mb-1 sm:mb-2">{card.label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* NEOP Donut */}
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: "#1a472a" }}>
            Distribuição por NEOP
          </h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-xs sm:text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={neopData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ cx, cy, midAngle, outerRadius, name, percent, index }) => {
                    if (percent === 0) return "";
                    const RADIAN = Math.PI / 180;
                    // Aumentar o raio para segmentos pequenos para evitar sobreposição
                    const baseRadius = outerRadius + 60;
                    const radius = percent < 0.1 ? baseRadius + 40 : baseRadius;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={NEOP_COLORS[index]}
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={true}
                >
                  {neopData.map((_, i) => (
                    <Cell key={i} fill={NEOP_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Bar Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: "#1a472a" }}>
            Distribuição por Pontuação
          </h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-xs sm:text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Avaliações" fill="#1a472a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Mapa de Portugal com 4º NEOP por CTer */}
      <PortugalMap neop4ByCter={neop4ByCter} cterCoordinates={CTER_COORDINATES} />
    </div>
  );
}
