import jsPDF from "jspdf";
import { useState } from "react";

export const useFormScreenshot = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadFormScreenshot = async (elementId: string, docNumber?: string) => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento do formulário não encontrado");
      }

      // Clonar elemento
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Remover todas as classes para evitar oklch
      clonedElement.className = "";
      const removeClasses = (el: HTMLElement) => {
        el.className = "";
        for (let i = 0; i < el.children.length; i++) {
          removeClasses(el.children[i] as HTMLElement);
        }
      };
      removeClasses(clonedElement);

      // Aplicar estilos inline básicos
      clonedElement.style.cssText = "background-color: white; padding: 20px; font-family: Arial, sans-serif;";

      // Posicionar fora da tela
      clonedElement.style.position = "fixed";
      clonedElement.style.left = "-9999px";
      clonedElement.style.top = "-9999px";
      clonedElement.style.width = element.offsetWidth + "px";
      clonedElement.style.zIndex = "-9999";

      document.body.appendChild(clonedElement);

      // Aguardar renderização
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Usar html2canvas sem processar cores
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
        ignoreElements: (element: Element) => {
          return element.tagName === "SCRIPT" || element.tagName === "STYLE";
        },
      });

      // Remover elemento clonado
      document.body.removeChild(clonedElement);

      // Verificar se canvas tem conteúdo
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas vazio - elemento não foi capturado");
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
