import html2canvas from "html2canvas";
import { useState } from "react";

export function useChartDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadChart = async (
    elementId: string,
    filename: string,
    format: "png" | "jpeg" = "png"
  ) => {
    try {
      setIsDownloading(true);
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.error(`Element with id ${elementId} not found`);
        alert(`Erro: Elemento "${elementId}" não encontrado`);
        setIsDownloading(false);
        return;
      }

      // Aguardar um pouco para garantir que o elemento está renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Erro ao criar blob");
          alert("Erro ao descarregar gráfico");
          setIsDownloading(false);
          return;
        }

        // Criar URL do blob
        const url = URL.createObjectURL(blob);
        
        // Criar link e descarregar
        const link = document.createElement("a");
        link.href = url;
        link.download = format === "jpeg" ? `${filename}.jpg` : `${filename}.png`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL
        URL.revokeObjectURL(url);
        
        setIsDownloading(false);
      }, format === "jpeg" ? "image/jpeg" : "image/png", format === "jpeg" ? 0.95 : undefined);
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
      alert(`Erro ao descarregar gráfico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsDownloading(false);
    }
  };

  return { downloadChart, isDownloading };
}
