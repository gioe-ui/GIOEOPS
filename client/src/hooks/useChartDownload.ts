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
          useCORS: false,
          allowTaint: true,
          imageTimeout: 0,
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

            // Remover todos os atributos style que contenham oklch
            const allElements = clonedDocument.querySelectorAll("*");
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style && htmlEl.style.cssText) {
                // Se o style contém oklch, remover completamente
                if (htmlEl.style.cssText.includes("oklch")) {
                  htmlEl.style.cssText = "";
                }
              }
            });
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
