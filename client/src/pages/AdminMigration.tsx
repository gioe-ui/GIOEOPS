import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminMigration() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const migrationMutation = trpc.system.runMigration.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });

  const handleRunMigration = async () => {
    setStatus("running");
    setMessage("");
    await migrationMutation.mutateAsync();
  };

  // Only show to admins
  if (!user || user.role !== "admin") {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Only admins can run migrations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Database Migration</h3>
        <p className="text-sm text-blue-800 mb-4">
          This will add the audit tracking columns (updatedBy, updatedAt) to the evaluations table.
        </p>

        <Button
          onClick={handleRunMigration}
          disabled={status === "running" || status === "success"}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {status === "running" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === "running" ? "Running Migration..." : "Run Migration"}
        </Button>
      </div>

      {status === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900">Migration Successful</h4>
            <p className="text-sm text-green-800">{message}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Migration Failed</h4>
            <p className="text-sm text-red-800">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
