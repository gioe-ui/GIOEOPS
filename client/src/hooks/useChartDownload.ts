import html2canvas from "html2canvas";
import { useState } from "react";

// Converter oklch para RGB
function oklchToRgb(oklchString: string): string {
  const match = oklchString.match(/oklch\(([\d.]+)%?\s+([\d.]+)%?\s+([\d.]+)deg?\)/);
  if (!match) return oklchString;

  const [, lStr, cStr, hStr] = match;
  const l = parseFloat(lStr) / 100;
  const c = parseFloat(cStr) / 100;
  const h = parseFloat(hStr) * (Math.PI / 180);

  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291486575 * b;

  const l2 = l_ * l_ * l_;
  const m2 = m_ * m_ * m_;
  const s2 = s_ * s_ * s_;

  const r = 4.0767416621 * l2 - 3.3077363322 * m2 + 0.2309101289 * s2;
  const g = -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193761 * s2;
  const b2 = -0.0041960771 * l2 - 0.7034186147 * m2 + 1.707614701 * s2;

  const toLinear = (x: number) => {
    const abs = Math.abs(x);
    return x >= 0
      ? Math.pow(Math.max(0, x), 2)
      : -Math.pow(Math.max(0, abs), 2);
  };

  const rGamma = toLinear(r);
  const gGamma = toLinear(g);
  const bGamma = toLinear(b2);

  const rInt = Math.round(Math.max(0, Math.min(255, rGamma * 255)));
  const gInt = Math.round(Math.max(0, Math.min(255, gGamma * 255)));
  const bInt = Math.round(Math.max(0, Math.min(255, bGamma * 255)));

  return `rgb(${rInt}, ${gInt}, ${bInt})`;
}

// Converter todas as cores oklch para RGB recursivamente
function convertOklchToRgb(element: HTMLElement) {
  const allElements = [element, ...Array.from(element.querySelectorAll("*"))];

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);

    // Verificar todas as propriedades de cor
    const colorProps = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "fill",
      "stroke",
    ];

    colorProps.forEach((prop) => {
      const value = style.getPropertyValue(prop);
      if (value && value.includes("oklch")) {
        const rgbValue = oklchToRgb(value);
        htmlEl.style.setProperty(prop, rgbValue, "important");
      }
    });

    // Também processar o atributo style direto
    if (htmlEl.style.cssText) {
      let cssText = htmlEl.style.cssText;
      const oklchMatches = cssText.match(/oklch\([^)]+\)/g);
      if (oklchMatches) {
        oklchMatches.forEach((match) => {
          const rgbValue = oklchToRgb(match);
          cssText = cssText.replace(match, rgbValue);
        });
        htmlEl.style.cssText = cssText;
      }
    }
  });
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
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clonar o elemento
      const clone = element.cloneNode(true) as HTMLElement;

      // Converter oklch para RGB
      convertOklchToRgb(clone);

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
        canvas.toBlob(
          (blob) => {
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
            link.download =
              format === "jpeg" ? `${filename}.jpg` : `${filename}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar URL
            URL.revokeObjectURL(url);

            // Remover container temporário
            document.body.removeChild(tempContainer);

            setIsDownloading(false);
          },
          format === "jpeg" ? "image/jpeg" : "image/png",
          format === "jpeg" ? 0.95 : undefined
        );
      } catch (error) {
        document.body.removeChild(tempContainer);
        throw error;
      }
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
