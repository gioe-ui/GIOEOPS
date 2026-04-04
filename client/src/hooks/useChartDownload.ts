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
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clonar o elemento
      const clone = element.cloneNode(true) as HTMLElement;

      // Remover todas as classes que possam conter oklch
      const removeClasses = (el: HTMLElement) => {
        el.className = "";
        const allElements = el.querySelectorAll("*");
        allElements.forEach((child) => {
          (child as HTMLElement).className = "";
        });
      };

      removeClasses(clone);

      // Aplicar estilos inline RGB básicos
      const applyBasicStyles = (el: HTMLElement) => {
        el.style.backgroundColor = "rgb(255, 255, 255)";
        el.style.color = "rgb(0, 0, 0)";
        el.style.fontFamily = "Arial, sans-serif";

        const allElements = el.querySelectorAll("*");
        allElements.forEach((child) => {
          const htmlChild = child as HTMLElement;
          const style = window.getComputedStyle(child);

          // Aplicar cores RGB básicas
          if (style.backgroundColor && !style.backgroundColor.includes("transparent")) {
            htmlChild.style.backgroundColor = "rgb(240, 240, 240)";
          }
          if (style.color) {
            htmlChild.style.color = "rgb(0, 0, 0)";
          }

          // Aplicar padding e margin
          htmlChild.style.padding = style.padding;
          htmlChild.style.margin = style.margin;
          htmlChild.style.width = style.width;
          htmlChild.style.height = style.height;
        });
      };

      applyBasicStyles(clone);

      // Criar container temporário
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "1200px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Usar html2canvas com opções para evitar erros de CSS
        const canvas = await html2canvas(clone, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          ignoreElements: (element: Element) => {
            // Ignorar scripts, estilos e comentários
            return (
              element.tagName === "SCRIPT" ||
              element.tagName === "STYLE" ||
              element.nodeType === 8
            );
          },
          onclone: (clonedDocument: Document) => {
            // Remover todas as tags style
            const styles = clonedDocument.querySelectorAll("style");
            styles.forEach((style) => style.remove());
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
