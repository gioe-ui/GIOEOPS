import html2canvas from "html2canvas";
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

      // Capturar o elemento como canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

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

      // Se a imagem for maior que a página, redimensionar
      let yPosition = 5;
      if (imgHeight > pageHeight - 10) {
        const scale = (pageHeight - 10) / imgHeight;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        doc.addImage(imgData, "PNG", 5, yPosition, scaledWidth, scaledHeight);
      } else {
        doc.addImage(imgData, "PNG", 5, yPosition, imgWidth, imgHeight);
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
