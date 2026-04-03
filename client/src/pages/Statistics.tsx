import { trpc } from "@/lib/trpc";
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
} from "recharts";

const NEOP_COLORS = ["#1a472a", "#b8860b", "#8b0000"];

export default function Statistics() {
  const { data: stats, isLoading } = trpc.statistics.get.useQuery();

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

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-6" style={{ color: "#1a472a" }}>
        Estatísticas
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="text-white text-center py-5 px-3 rounded-xl"
            style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
          >
            <p className="text-xs uppercase tracking-wider opacity-80 mb-2">{card.label}</p>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEOP Donut */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
            Distribuição por NEOP
          </h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={neopData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ""
                  }
                  labelLine={false}
                >
                  {neopData.map((_, i) => (
                    <Cell key={i} fill={NEOP_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Bar Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#1a472a" }}>
            Distribuição por Pontuação
          </h3>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sem dados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Avaliações" fill="#1a472a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
