import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, Hash, Award, Save, X } from "lucide-react";

const RANKS = [
  "Guarda", "Guarda-Principal", "Cabo", "Cabo-Chefe", "Cabo-Mor",
  "2º Sargento", "1º Sargento", "Sargento-Ajudante", "Sargento-Chefe",
  "Alferes", "Tenente", "Capitão", "Major", "Tenente Coronel"
];

export default function Profile() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    mecanographicNumber: user?.mecanographicNumber || "",
    rank: user?.rank || "",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">A carregar perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Utilizador não encontrado</div>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    // Validações
    if (!formData.name || formData.name.length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      return;
    }
    if (formData.phoneNumber && formData.phoneNumber.length < 9) {
      toast.error("Número de telefone inválido");
      return;
    }
    if (formData.mecanographicNumber && !/^\d{7}$/.test(formData.mecanographicNumber)) {
      toast.error("Número mecanográfico deve ter 7 dígitos");
      return;
    }

    updateMutation.mutate({
      name: formData.name !== user.name ? formData.name : undefined,
      phoneNumber: formData.phoneNumber !== user.phoneNumber ? formData.phoneNumber : undefined,
      mecanographicNumber: formData.mecanographicNumber !== user.mecanographicNumber ? formData.mecanographicNumber : undefined,
      rank: formData.rank !== user.rank ? formData.rank : undefined,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      mecanographicNumber: user?.mecanographicNumber || "",
      rank: user?.rank || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1a472a" }}>
            Meu Perfil
          </h1>
          <p className="text-gray-600">Visualize e edite suas informações pessoais</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Avatar Section */}
          <div className="flex items-center mb-8 pb-8 border-b border-gray-200">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mr-6"
              style={{ background: "#1a472a" }}
            >
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="border-2 focus:border-[#1a472a]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {user.name}
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <Label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                {user.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
            </div>

            {/* Phone Number */}
            <div>
              <Label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Número de Telefone
              </Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  placeholder="Ex: 912345678"
                  className="border-2 focus:border-[#1a472a]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {user.phoneNumber || "Não preenchido"}
                </div>
              )}
            </div>

            {/* Mecanographic Number */}
            <div>
              <Label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Número Mecanográfico
              </Label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.mecanographicNumber}
                  onChange={(e) => handleChange("mecanographicNumber", e.target.value)}
                  placeholder="Ex: 2000057 (7 dígitos)"
                  className="border-2 focus:border-[#1a472a]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {user.mecanographicNumber || "Não preenchido"}
                </div>
              )}
            </div>

            {/* Rank */}
            <div>
              <Label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-2">
                <Award className="w-4 h-4" />
                Posto
              </Label>
              {isEditing ? (
                <select
                  value={formData.rank}
                  onChange={(e) => handleChange("rank", e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-[#1a472a] focus:outline-none"
                >
                  <option value="">Selecione um posto</option>
                  {RANKS.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                  {user.rank || "Não preenchido"}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-8 border-t border-gray-200">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2"
                style={{ background: "#1a472a" }}
              >
                <Save className="w-4 h-4" />
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2"
                  style={{ background: "#1a472a" }}
                >
                  {updateMutation.isPending ? "A guardar..." : "Guardar Alterações"}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> O seu email não pode ser alterado. Se precisar de ajuda, contacte o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
