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

      // Procurar pelo SVG dentro do elemento (ignorar bandeiras)
      let svgs = element.querySelectorAll("svg");
      console.log(`SVGs dentro do elemento: ${svgs.length}`);
      
      // Se não encontrar SVGs dentro do elemento, procurar em todo o documento
      if (svgs.length === 0) {
        svgs = document.querySelectorAll("svg");
        console.log(`SVGs no documento: ${svgs.length}`);
      }
      
      let targetSvg: SVGElement | null = null;

      // Encontrar o SVG mais grande (provavelmente o gráfico)
      let maxArea = 0;
      
      svgs.forEach((svg: Element, index: number) => {
        const rect = (svg as SVGElement).getBoundingClientRect();
        const area = rect.width * rect.height;
        console.log(`SVG ${index}: ${rect.width}x${rect.height} = ${area}px²`);
        
        // Ignorar SVGs muito pequenos (provavelmente ícones ou bandeiras)
        if (area > 50 && area > maxArea) {
          maxArea = area;
          targetSvg = svg as SVGElement;
        }
      });
      
      console.log(`SVG selecionado com área: ${maxArea}px²`);

      if (!targetSvg) {
        console.error("SVG do gráfico não encontrado");
        alert("SVG do gráfico não encontrado");
        setIsDownloading(false);
        return;
      }

      // Usar canvas2d para capturar o SVG
      const rect = (targetSvg as SVGElement).getBoundingClientRect();
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
      const svgString = new XMLSerializer().serializeToString(targetSvg as SVGElement);
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
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
      };
      
      img.onerror = () => {
        console.error("Erro ao carregar SVG como imagem");
        alert("Erro ao processar gráfico");
        setIsDownloading(false);
      };
      
      // Converter para data URL
      // Usar encodeURIComponent para suportar caracteres acentuados
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
      alert(`Erro ao descarregar gráfico: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsDownloading(false);
    }
  };

  return { downloadChart, isDownloading };
};
