import html2canvas from "html2canvas";
import { useState } from "react";

// Converter oklch para RGB
function oklchToRgb(oklch: string): string {
  const match = oklch.match(/oklch\s*\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return oklch;

  const [, l, c, h] = match.map(Number);
  const hRad = (h * Math.PI) / 180;

  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const r = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  const g = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  const b_ = Math.pow(l - 0.0894841775 * a - 1.291486575 * b, 3);

  const red = Math.round(Math.max(0, Math.min(255, r * 255)));
  const green = Math.round(Math.max(0, Math.min(255, g * 255)));
  const blue = Math.round(Math.max(0, Math.min(255, b_ * 255)));

  return `rgb(${red}, ${green}, ${blue})`;
}

// Converter todas as cores oklch no elemento para RGB
function convertOklchToRgb(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Processar estilos computados de todos os elementos
  const allElements = clone.querySelectorAll("*");
  allElements.forEach((el) => {
    const element = el as HTMLElement;
    const styles = window.getComputedStyle(element);
    
    // Converter cores oklch em background, color, border, etc.
    const properties = [
      "backgroundColor",
      "color",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
    ];

    properties.forEach((prop) => {
      const value = styles.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
      if (value && value.includes("oklch")) {
        const rgbValue = oklchToRgb(value);
        element.style[prop as any] = rgbValue;
      }
    });
  });

  // Processar elemento raiz
  const styles = window.getComputedStyle(element);
  const properties = [
    "backgroundColor",
    "color",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
  ];

  properties.forEach((prop) => {
    const value = styles.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
    if (value && value.includes("oklch")) {
      const rgbValue = oklchToRgb(value);
      clone.style[prop as any] = rgbValue;
    }
  });

  return clone;
}

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

      // Converter oklch para RGB antes de capturar
      const processedElement = convertOklchToRgb(element);
      
      // Criar container temporário para o elemento processado
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.appendChild(processedElement);
      document.body.appendChild(tempContainer);

      try {
        const canvas = await html2canvas(processedElement, {
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
