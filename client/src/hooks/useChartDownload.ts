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

      // Verificar se é um mapa Leaflet
      const isLeafletMap = element.classList.contains("leaflet-container") || 
                          element.querySelector(".leaflet-container") !== null;

      if (isLeafletMap) {
        // Para mapas Leaflet, usar html2canvas com configurações especiais
        const { default: html2canvas } = await import("html2canvas");
        
        // Clonar o elemento
        const clone = element.cloneNode(true) as HTMLElement;

        // Remover atributos de estilo que possam conter oklch
        const removeOklchStyles = (el: HTMLElement) => {
          el.removeAttribute("style");
          const allElements = el.querySelectorAll("*");
          allElements.forEach((child) => {
            (child as HTMLElement).removeAttribute("style");
          });
        };

        removeOklchStyles(clone);

        // Criar container temporário
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "-9999px";
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        try {
          const canvas = await html2canvas(clone, {
            backgroundColor: "#ffffff",
            scale: 2,
            logging: false,
            useCORS: false,
            allowTaint: true,
            imageTimeout: 0,
            ignoreElements: (element: Element): boolean => {
              // Ignorar scripts, estilos, comentários e imagens de atribuição
              const src = element.getAttribute("src") || "";
              const alt = element.getAttribute("alt") || "";
              return (
                element.tagName === "SCRIPT" ||
                element.tagName === "STYLE" ||
                element.nodeType === 8 ||
                (element.tagName === "IMG" && 
                 (src.includes("ukraine") || 
                  alt.includes("ukraine") ||
                  src.includes("flag")))
              );
            },
            onclone: (clonedDocument: Document) => {
              const styles = clonedDocument.querySelectorAll("style");
              styles.forEach((style) => style.remove());

              // Remover imagens de atribuição/bandeiras
              const allImages = clonedDocument.querySelectorAll("img");
              allImages.forEach((img) => {
                const src = img.getAttribute("src") || "";
                const alt = img.getAttribute("alt") || "";
                if (src.includes("ukraine") || alt.includes("ukraine") || src.includes("flag")) {
                  img.remove();
                }
              });

              // Remover estilos inline com oklch
              const allElements = clonedDocument.querySelectorAll("*");
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (htmlEl.style && htmlEl.style.cssText) {
                  if (htmlEl.style.cssText.includes("oklch")) {
                    htmlEl.style.cssText = "";
                  }
                }
              });
            },
          });

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Erro ao criar blob");
                alert("Erro ao descarregar mapa");
                setIsDownloading(false);
                document.body.removeChild(tempContainer);
                return;
              }

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download =
                format === "jpeg" ? `${filename}.jpg` : `${filename}.png`;

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              URL.revokeObjectURL(url);
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
      } else {
        // Para gráficos Recharts, capturar SVG diretamente
        const svg = element.querySelector("svg");
        if (!svg) {
          console.error("SVG not found in element");
          alert("Erro: Gráfico SVG não encontrado");
          setIsDownloading(false);
          return;
        }

        const clonedSvg = svg.cloneNode(true) as SVGElement;

        // Remover atributos de estilo
        const removeOklchStyles = (el: Element) => {
          el.removeAttribute("style");
          const allElements = el.querySelectorAll("*");
          allElements.forEach((child) => {
            child.removeAttribute("style");
          });
        };

        removeOklchStyles(clonedSvg);

        const svgRect = svg.getBoundingClientRect();
        const width = svgRect.width || 800;
        const height = svgRect.height || 400;

        const canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;

        const svgString = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], {
          type: "image/svg+xml;charset=utf-8",
        });
        const svgUrl = URL.createObjectURL(svgBlob);

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

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Erro ao criar blob");
                alert("Erro ao descarregar gráfico");
                setIsDownloading(false);
                URL.revokeObjectURL(svgUrl);
                return;
              }

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download =
                format === "jpeg" ? `${filename}.jpg` : `${filename}.png`;

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

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

        img.crossOrigin = "anonymous";
        img.src = svgUrl;
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
