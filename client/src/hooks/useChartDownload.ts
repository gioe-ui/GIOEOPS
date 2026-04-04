import html2canvas from "html2canvas";

export function useChartDownload() {
  const downloadChart = async (
    elementId: string,
    filename: string,
    format: "png" | "jpeg" = "png"
  ) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      if (format === "jpeg") {
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.download = `${filename}.jpg`;
      } else {
        link.href = canvas.toDataURL("image/png");
        link.download = `${filename}.png`;
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao descarregar gráfico:", error);
    }
  };

  return { downloadChart };
}
