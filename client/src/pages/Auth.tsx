import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Shield, AlertCircle } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663511663974/bkxrxh5szwZfcvrDKi6FHK/gioe_logo_960e9077.webp";

type AuthMode = "login" | "register";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso! Por favor, faça login.");
      setMode("login");
      setEmail("");
      setName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      window.location.reload();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRegister = () => {
    if (!email || !name) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (!email.endsWith("@gnr.pt")) {
      toast.error("Email deve terminar em @gnr.pt");
      return;
    }
    registerMutation.mutate({ email, name });
  };

  const handleLogin = () => {
    if (!email) {
      toast.error("Preencha o email.");
      return;
    }
    if (!email.endsWith("@gnr.pt")) {
      toast.error("Email deve terminar em @gnr.pt");
      return;
    }
    loginMutation.mutate({ email });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="text-white text-center py-10 px-5"
          style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
        >
          <img
            src={LOGO_URL}
            alt="Logo GNR/GIOE"
            className="w-28 h-28 mx-auto mb-5 object-contain"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
          />
          <h1 className="text-2xl font-bold tracking-widest mb-1">GIOE</h1>
          <p className="text-sm opacity-90">Grupo de Intervenção de Operações Especiais</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: "#1a472a" }} />
            <h2 className="text-xl font-bold" style={{ color: "#1a472a" }}>
              Sistema de Avaliação de Pedidos de Apoio
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Acesso restrito a elementos da GNR com email institucional
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                mode === "login"
                  ? "border-[#1a472a] text-[#1a472a]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-1" />
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                mode === "register"
                  ? "border-[#1a472a] text-[#1a472a]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1" />
              Registo
            </button>
          </div>

          {/* Login Form */}
          {mode === "login" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-600 mb-1 block">
                  Email (@gnr.pt)
                </Label>
                <Input
                  type="email"
                  placeholder="seu.email@gnr.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="border-2 focus:border-[#1a472a]"
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loginMutation.isPending}
                className="w-full py-2 text-base font-semibold"
                style={{ background: "#1a472a" }}
              >
                {loginMutation.isPending ? "A fazer login..." : "Entrar"}
              </Button>
            </div>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Registe-se com o seu email institucional <strong>@gnr.pt</strong>
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600 mb-1 block">Nome</Label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 focus:border-[#1a472a]"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-600 mb-1 block">
                  Email (@gnr.pt)
                </Label>
                <Input
                  type="email"
                  placeholder="seu.email@gnr.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className="border-2 focus:border-[#1a472a]"
                />
              </div>
              <Button
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full py-2 text-base font-semibold"
                style={{ background: "#1a472a" }}
              >
                {registerMutation.isPending ? "A registar..." : "Criar Conta"}
              </Button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
