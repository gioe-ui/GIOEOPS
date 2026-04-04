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
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Encontrar o SVG dentro do elemento
      const svg = element.querySelector("svg");
      if (!svg) {
        console.error("SVG not found in element");
        alert("Erro: Gráfico SVG não encontrado");
        setIsDownloading(false);
        return;
      }

      // Clonar o SVG
      const clonedSvg = svg.cloneNode(true) as SVGElement;

      // Remover atributos de estilo que possam conter oklch
      const removeOklchStyles = (el: Element) => {
        // Remover atributo style
        el.removeAttribute("style");

        // Processar todos os elementos filhos
        const allElements = el.querySelectorAll("*");
        allElements.forEach((child) => {
          child.removeAttribute("style");
        });
      };

      removeOklchStyles(clonedSvg);

      // Obter as dimensões do SVG
      const svgRect = svg.getBoundingClientRect();
      const width = svgRect.width || 800;
      const height = svgRect.height || 400;

      // Criar canvas
      const canvas = document.createElement("canvas");
      canvas.width = width * 2; // Escala 2x para melhor qualidade
      canvas.height = height * 2;

      // Converter SVG para string
      const svgString = new XMLSerializer().serializeToString(clonedSvg);

      // Criar blob do SVG
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Criar imagem a partir do SVG
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.error("Canvas context not available");
          alert("Erro ao descarregar gráfico");
          setIsDownloading(false);
          URL.revokeObjectURL(svgUrl);
          return;
        }

        // Preencher fundo branco
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar imagem
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Converter canvas para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error("Erro ao criar blob");
              alert("Erro ao descarregar gráfico");
              setIsDownloading(false);
              URL.revokeObjectURL(svgUrl);
              return;
            }

            // Criar URL do blob
            const url = URL.createObjectURL(blob);

            // Criar link e descarregar
            const link = document.createElement("a");
            link.href = url;
            link.download =
              format === "jpeg" ? `${filename}.jpg` : `${filename}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar URLs
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);

            setIsDownloading(false);
          },
          format === "jpeg" ? "image/jpeg" : "image/png",
          format === "jpeg" ? 0.95 : undefined
        );
      };

      img.onerror = () => {
        console.error("Erro ao carregar imagem do SVG");
        alert("Erro ao descarregar gráfico");
        setIsDownloading(false);
        URL.revokeObjectURL(svgUrl);
      };

      // Definir a origem do CORS
      img.crossOrigin = "anonymous";
      img.src = svgUrl;
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
      alert(
        `Erro ao descarregar gráfico: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
      setIsDownloading(false);
    }
  };

  return { downloadChart, isDownloading };
}
