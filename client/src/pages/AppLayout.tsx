import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, BarChart2, PieChart, Users, CheckCircle } from "lucide-react";
import EvaluationForm from "./EvaluationForm";
import Dashboard from "./Dashboard";
import { StatisticsPage } from "./Statistics";
import UsersPage from "./UsersPage";
import UserApprovals from "./UserApprovals";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663511663974/bkxrxh5szwZfcvrDKi6FHK/gioe_logo_960e9077.webp";

type Tab = "form" | "dashboard" | "statistics" | "users" | "approvals";

const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: "form", label: "Novo Formulário", icon: <FileText className="w-4 h-4" /> },
  { id: "dashboard", label: "Dashboard", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "statistics", label: "Estatísticas", icon: <PieChart className="w-4 h-4" /> },
  { id: "users", label: "Utilizadores", icon: <Users className="w-4 h-4" />, adminOnly: true },
  { id: "approvals", label: "Aprovações", icon: <CheckCircle className="w-4 h-4" />, adminOnly: true },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("form");

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || user?.role === "admin");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo GNR/GIOE" className="w-11 h-11 object-contain" />
            <div>
              <h1 className="text-lg font-bold tracking-wide leading-tight">
                GIOE — Avaliação de Pedidos de Apoio
              </h1>
              {user && (
                <p className="text-xs opacity-75">{user.name || user.email}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-white/60 text-white hover:bg-white/20 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-[3px] transition-colors ${
                activeTab === tab.id
                  ? "border-[#1a472a] text-[#1a472a]"
                  : "border-transparent text-gray-500 hover:text-[#1a472a] hover:bg-green-50"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "form" && <EvaluationForm />}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "statistics" && <StatisticsPage />}
        {activeTab === "users" && user?.role === "admin" && <UsersPage />}
        {activeTab === "approvals" && user?.role === "admin" && <UserApprovals />}
      </main>
    </div>
  );
}
