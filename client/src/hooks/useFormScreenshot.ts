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

// Processar estilos para converter oklch - versão melhorada
const processStylesForCanvas = (element: HTMLElement) => {
  // Processar o elemento raiz
  processElement(element);

  // Processar todos os filhos recursivamente
  const processChildren = (el: HTMLElement) => {
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      processElement(child);
      processChildren(child);
    }
  };

  processChildren(element);
};

const processElement = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);

  // Processar propriedades de cor
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
    "textShadow",
    "boxShadow",
    "fill",
    "stroke",
  ];

  for (const prop of colorProps) {
    const value = style.getPropertyValue(prop);
    if (value && value.includes("oklch")) {
      const rgbValue = oklchToRgb(value);
      element.style.setProperty(prop, rgbValue, "important");
    }
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

      // Clonar elemento para não modificar o original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.position = "absolute";
      clonedElement.style.left = "-9999px";
      clonedElement.style.top = "-9999px";
      clonedElement.style.visibility = "hidden";
      clonedElement.style.width = element.offsetWidth + "px";
      clonedElement.style.backgroundColor = "#ffffff";
      document.body.appendChild(clonedElement);

      // Processar estilos oklch recursivamente
      processStylesForCanvas(clonedElement);

      // Aguardar um pouco para garantir que os estilos foram aplicados
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capturar o elemento como canvas
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 5000,
        ignoreElements: (element: Element) => {
          return element.tagName === "SCRIPT" || element.tagName === "STYLE";
        },
      });

      // Remover elemento clonado
      document.body.removeChild(clonedElement);

      // Verificar se o canvas tem conteúdo
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Não foi possível obter contexto do canvas");
      }

      // Converter canvas para imagem
      const imgData = canvas.toDataURL("image/png");

      // Criar PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calcular dimensões da imagem para caber na página
      const imgWidth = pageWidth - 10; // Margem de 5mm em cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Adicionar imagem ao PDF
      if (imgHeight > pageHeight - 10) {
        // Se a imagem for maior que a página, redimensionar
        const scale = (pageHeight - 10) / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        doc.addImage(imgData, "PNG", 5, 5, scaledWidth, scaledHeight);
      } else {
        // Se caber na página, adicionar com tamanho normal
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
