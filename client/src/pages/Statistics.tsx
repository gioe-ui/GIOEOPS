import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100 mt-8">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-3 sm:mb-4" style={{ color: "#1a472a" }}>
          Mapa de 4º NEOP por CTer
        </h3>
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center relative">
          <svg viewBox="-10 36 20 12" className="w-full h-full" style={{ background: "#e8f4f8" }}>
            {/* Contorno simplificado de Portugal Continental */}
            <path
              d="M -9.5 36.5 L -9 37 L -8.5 37.2 L -8 37 L -7.5 37.5 L -7 37.3 L -6.5 37.8 L -6 37.5 L -5.5 38 L -5 37.7 L -4.5 38.2 L -4 38 L -3.5 38.5 L -3 38.2 L -2.5 38.7 L -2 38.4 L -1.5 38.9 L -1 38.6 L -0.5 39 L 0 38.7 L 0.5 39.2 L 1 38.9 L 1.5 39.4 L 2 39.1 L 2.5 39.6 L 3 39.3 L 3.5 39.8 L 4 39.5 L 4.5 40 L 5 39.7 L 5.5 40.2 L 6 39.9 L 6.5 40.4 L 7 40.1 L 7.5 40.6 L 8 40.3 L 8.5 40.8 L 9 40.5 L 9.5 41 L 9 41.5 L 8.5 41.2 L 8 41.7 L 7.5 41.4 L 7 41.9 L 6.5 41.6 L 6 42.1 L 5.5 41.8 L 5 42.3 L 4.5 42 L 4 42.5 L 3.5 42.2 L 3 42.7 L 2.5 42.4 L 2 42.9 L 1.5 42.6 L 1 43.1 L 0.5 42.8 L 0 43.3 L -0.5 43 L -1 43.5 L -1.5 43.2 L -2 43.7 L -2.5 43.4 L -3 43.9 L -3.5 43.6 L -4 44.1 L -4.5 43.8 L -5 44.3 L -5.5 44 L -6 44.5 L -6.5 44.2 L -7 44.7 L -7.5 44.4 L -8 44.9 L -8.5 44.6 L -9 45.1 L -9.5 44.8 L -9.5 36.5 Z"
              fill="#d0e8f2"
              stroke="#1a472a"
              strokeWidth="0.1"
            />
            {/* Pontos vermelhos para 4º NEOP por CTer */}
            {neop4ByCter && Object.entries(neop4ByCter).map(([cterName, count]) => {
              const coords = CTER_COORDINATES[cterName];
              if (!coords) return null;
              // Normalizar coordenadas para o viewBox (-10 a 10 em longitude, 36 a 48 em latitude)
              const x = (coords.lng + 10) / 2 - 5;
              const y = 48 - coords.lat;
              const size = Math.min(0.3 + count * 0.1, 0.8);
              return (
                <g key={cterName}>
                  <circle cx={x} cy={y} r={size} fill="#ef4444" opacity="0.8" />
                  <circle cx={x} cy={y} r={size} fill="none" stroke="#dc2626" strokeWidth="0.05" />
                  <text x={x} y={y - size - 0.2} fontSize="0.15" fill="#1a472a" textAnchor="middle" fontWeight="bold">
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-xs text-gray-600 mt-2">Pontos vermelhos indicam registos de 4º NEOP. Tamanho e número indicam quantidade por CTer.</p>
      </div>
    </div>
  );
}
