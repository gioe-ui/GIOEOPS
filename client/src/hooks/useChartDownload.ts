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

      // Clonar o elemento
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Remover atributos de estilo que possam conter oklch
      const removeOklchStyles = (el: HTMLElement) => {
        // Remover atributos style inline
        el.removeAttribute("style");
        
        // Processar todos os elementos filhos
        const allElements = el.querySelectorAll("*");
        allElements.forEach((child) => {
          (child as HTMLElement).removeAttribute("style");
        });
      };

      removeOklchStyles(clone);

      // Criar container temporário
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "1200px";
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Usar html2canvas com allowTaint para ignorar erros de CORS
        const canvas = await html2canvas(clone, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          ignoreElements: (element: Element) => {
            // Ignorar scripts e estilos
            return element.tagName === "SCRIPT" || element.tagName === "STYLE";
          },
        });

        // Converter canvas para blob
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Erro ao criar blob");
            alert("Erro ao descarregar gráfico");
            setIsDownloading(false);
            document.body.removeChild(tempContainer);
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
          
          // Remover container temporário
          document.body.removeChild(tempContainer);
          
          setIsDownloading(false);
        }, format === "jpeg" ? "image/jpeg" : "image/png", format === "jpeg" ? 0.95 : undefined);
      } catch (error) {
        document.body.removeChild(tempContainer);
        throw error;
      }
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
      alert(`Erro ao descarregar gráfico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsDownloading(false);
    }
  };

  return { downloadChart, isDownloading };
}
