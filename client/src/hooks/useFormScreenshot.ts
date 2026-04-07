import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";

// Converter cores oklch para RGB
const oklchToRgb = (oklchColor: string): string => {
  const match = oklchColor.match(/oklch\(([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)\s*\/?(\s*[0-9.]*)?/);
  if (!match) return oklchColor;

  const L = parseFloat(match[1]) / 100;
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);
  const A = match[4] ? parseFloat(match[4]) : 1;

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291486575 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = 4.0767416621 * l3 - 3.3077363322 * m3 + 0.2309101289 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193761 * s3;
  const b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const toLinear = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  const R = Math.round(Math.max(0, Math.min(255, toLinear(r) * 255)));
  const G = Math.round(Math.max(0, Math.min(255, toLinear(g) * 255)));
  const B = Math.round(Math.max(0, Math.min(255, toLinear(b_) * 255)));

  if (A < 1) {
    return `rgba(${R}, ${G}, ${B}, ${A})`;
  }
  return `rgb(${R}, ${G}, ${B})`;
};

// Converter todas as cores oklch recursivamente
const convertOklchColors = (element: HTMLElement) => {
  // Processar inline styles
  if (element.style.cssText) {
    element.style.cssText = element.style.cssText.replace(/oklch\([^)]+\)/g, (match) => oklchToRgb(match));
  }

  // Processar cada propriedade de estilo
  const colorProps = [
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "fill",
    "stroke",
  ];

  for (const prop of colorProps) {
    const value = element.style.getPropertyValue(prop);
    if (value && value.includes("oklch")) {
      element.style.setProperty(prop, oklchToRgb(value), "important");
    }
  }

  // Processar recursivamente filhos
  for (let i = 0; i < element.children.length; i++) {
    convertOklchColors(element.children[i] as HTMLElement);
  }
};

export const useFormScreenshot = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadFormScreenshot = async (elementId: string, docNumber?: string) => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento do formulário não encontrado");
      }

      // Clonar o elemento original (sem remover classes)
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Posicionar fora da tela
      clonedElement.style.position = "fixed";
      clonedElement.style.left = "-9999px";
      clonedElement.style.top = "-9999px";
      clonedElement.style.width = element.offsetWidth + "px";
      clonedElement.style.zIndex = "-9999";
      clonedElement.style.backgroundColor = "#ffffff";

      // Adicionar ao DOM
      document.body.appendChild(clonedElement);

      // Converter cores oklch
      convertOklchColors(clonedElement);

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capturar com html2canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 5000,
        windowHeight: clonedElement.scrollHeight,
        windowWidth: clonedElement.scrollWidth,
      });

      // Remover elemento clonado
      document.body.removeChild(clonedElement);

      // Verificar se canvas tem conteúdo
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas vazio - elemento não foi capturado corretamente");
      }

      // Converter para imagem
      const imgData = canvas.toDataURL("image/png");

      // Criar PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calcular dimensões
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Adicionar imagem ao PDF
      if (imgHeight > pageHeight - 10) {
        const scale = (pageHeight - 10) / imgHeight;
        doc.addImage(imgData, "PNG", 5, 5, imgWidth * scale, imgHeight * scale);
      } else {
        doc.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
      }

      // Salvar PDF
      const fileName = `AVAL_OPS_GIOE_${docNumber || new Date().getTime()}.pdf`;
      doc.save(fileName);

      setIsGenerating(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsGenerating(false);
    }
  };

  return { downloadFormScreenshot, isGenerating };
};
