import { useState } from "react";

export const useChartDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadChart = async (
    elementId: string,
    filename: string,
    format: "png" | "jpeg" = "png"
  ) => {
    setIsDownloading(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Elemento com ID ${elementId} não encontrado`);
        alert("Elemento não encontrado");
        setIsDownloading(false);
        return;
      }

      // Usar canvas2d para capturar o elemento
      const canvas = await new Promise<HTMLCanvasElement>((resolve) => {
        const svg = element.querySelector("svg");
        
        if (svg) {
          // Se for SVG, converter para canvas
          const rect = svg.getBoundingClientRect();
          const canvas = document.createElement("canvas");
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Não foi possível obter contexto 2D");
          }
          
          ctx.scale(2, 2);
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, rect.width, rect.height);
          
          // Serializar SVG para string
          const svgString = new XMLSerializer().serializeToString(svg);
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
          };
          img.onerror = () => {
            // Se falhar, usar canvas branco
            resolve(canvas);
          };
          
          // Converter para data URL
          img.src = "data:image/svg+xml;base64," + btoa(svgString);
        } else {
          // Se não for SVG, usar html2canvas como fallback
          import("html2canvas").then(({ default: html2canvas }) => {
            html2canvas(element, {
              backgroundColor: "#ffffff",
              scale: 2,
              logging: false,
              useCORS: false,
              allowTaint: true,
              imageTimeout: 0,
            }).then(resolve);
          });
        }
      });

      // Converter canvas para blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Erro ao criar blob");
            alert("Erro ao descarregar gráfico");
            setIsDownloading(false);
            return;
          }

          // Criar link de download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        },
        `image/${format}`,
        format === "jpeg" ? 0.95 : undefined
      );
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
      alert(`Erro ao descarregar gráfico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsDownloading(false);
    }
  };

  return { downloadChart, isDownloading };
};
