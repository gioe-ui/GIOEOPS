import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Shield } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663511663974/bkxrxh5szwZfcvrDKi6FHK/gioe_logo_960e9077.webp";

export default function Auth() {
  const loginUrl = getLoginUrl();

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

          <a href={loginUrl} className="block w-full">
            <Button
              className="w-full py-6 text-base font-semibold"
              style={{ background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)" }}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar com conta GNR
            </Button>
          </a>

          <p className="text-center text-xs text-gray-400 mt-4">
            Acesso exclusivo para elementos com email <strong>@gnr.pt</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
