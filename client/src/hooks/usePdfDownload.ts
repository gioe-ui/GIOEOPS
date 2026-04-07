import { jsPDF } from "jspdf";
import { useState } from "react";

export interface FormDataForPdf {
  pocPosto: string;
  pocNome: string;
  pocContacto: string;
  despacho: string;
  cterRequerente: string;
  mandadoDetencao: boolean;
  mandadoBusca: boolean;
  quantidadeSuspeitos: string;
  modalidadeIsolado: boolean;
  modalidadeAssociacao: boolean;
  tipoCriminal: string;
  antecedentesContraPessoas: boolean;
  antecedentesContraPatrimonio: boolean;
  antecedentesOutros: boolean;
  antecedentesFSS: string;
  posseArma: string;
  usoArma: string;
  tipologiaApartamento: boolean;
  tipologiaMoradia: boolean;
  tipologiaOutro: boolean;
  contextoIsolado: boolean;
  contextoBairroSocial: boolean;
  contextoMeioUrbano: boolean;
  contextoMeioRural: boolean;
  segurancaCaes: boolean;
  segurancaPortaBlindada: boolean;
  segurancaOutrasMedidas: boolean;
  avaliador: string;
  dataAvaliacao: string;
  parecer: string;
  pontuacao: number;
  neop: string;
  complexidade: string;
}

export const usePdfDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadFormPdf = async (formData: FormDataForPdf, docNumber?: string) => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth: number = doc.internal.pageSize.getWidth();
      const pageHeight: number = doc.internal.pageSize.getHeight();
      let yPosition: number = 10;

      // Cabeçalho GNR
      doc.setFontSize(10);
      doc.text("MINISTÉRIO DA ADMINISTRAÇÃO INTERNA", pageWidth / 2, yPosition);
      yPosition += 5;

      doc.setFontSize(14);
      doc.setFont(undefined as any, "bold" as any);
      doc.text("GUARDA NACIONAL REPUBLICANA", pageWidth / 2, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text("UNIDADE DE INTERVENÇÃO", pageWidth / 2, yPosition);
      yPosition += 4;

      doc.setFont(undefined as any, "bold" as any);
      doc.text(
        "GRUPO DE INTERVENÇÃO DE OPERAÇÕES ESPECIAIS",
        pageWidth / 2,
        yPosition
      );
      yPosition += 8;

      doc.setFont(undefined as any, "bold" as any);
      doc.setFontSize(12);
      doc.text("AVALIAÇÃO DE PEDIDO DE APOIO", pageWidth / 2, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `DOC N.º ${docNumber || "_______________"}`,
        pageWidth / 2,
        yPosition
      );
      yPosition += 10;

      // Seção POC e Despacho
      doc.setFont(undefined as any, "bold" as any);
      doc.text("POC (posto, nome e função)", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `${formData.pocPosto || ""} | ${formData.pocNome || ""} | ${formData.pocContacto || ""}`,
        15,
        yPosition
      );
      yPosition += 8;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("DESPACHO", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      const despachoLines = doc.splitTextToSize(formData.despacho || "", pageWidth - 30);
      doc.text(despachoLines, 15, yPosition);
      yPosition += despachoLines.length * 4 + 3;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("CTer Requerente", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(formData.cterRequerente || "", 15, yPosition);
      yPosition += 8;

      // Seção Suspeitos
      doc.setFont(undefined as any, "bold" as any);
      doc.text("SUSPEITO(S)", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Mandado de Detenção: ${formData.mandadoDetencao ? "☑" : "☐"} | Mandado de Busca: ${formData.mandadoBusca ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(`Quantidade: ${formData.quantidadeSuspeitos || ""}`, 15, yPosition);
      yPosition += 8;

      // Seção Atividade Criminal
      doc.setFont(undefined as any, "bold" as any);
      doc.text("ATIVIDADE CRIMINAL", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Isolado: ${formData.modalidadeIsolado ? "☑" : "☐"} | Associação Criminosa: ${formData.modalidadeAssociacao ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(
        `Antecedentes contra Pessoas: ${formData.antecedentesContraPessoas ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(
        `Antecedentes contra Patrimônio: ${formData.antecedentesContraPatrimonio ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(
        `Antecedentes contra FSS: ${formData.antecedentesFSS === "sim" ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 8;

      // Seção Meios
      doc.setFont(undefined as any, "bold" as any);
      doc.text("MEIOS", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Posse de Arma - Registada: ${formData.posseArma === "registada" ? "☑" : "☐"} | Provável: ${formData.posseArma === "provavel" ? "☑" : "☐"} | Improvável: ${formData.posseArma === "improvavel" ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(
        `Uso de Arma - Há Registo: ${formData.usoArma === "haRegisto" ? "☑" : "☐"} | Não há Registo: ${formData.usoArma === "naoHaRegisto" ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 8;

      // Seção Local
      doc.setFont(undefined as any, "bold" as any);
      doc.text("LOCAL", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Tipologia - Apartamento: ${formData.tipologiaApartamento ? "☑" : "☐"} | Moradia: ${formData.tipologiaMoradia ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 4;
      doc.text(
        `Contexto - Isolado: ${formData.contextoIsolado ? "☑" : "☐"} | Bairro Social: ${formData.contextoBairroSocial ? "☑" : "☐"} | Meio Urbano: ${formData.contextoMeioUrbano ? "☑" : "☐"} | Meio Rural: ${formData.contextoMeioRural ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 8;

      // Seção Características
      doc.setFont(undefined as any, "bold" as any);
      doc.text("CARACTERÍSTICAS", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Cães: ${formData.segurancaCaes ? "☑" : "☐"} | Porta Blindada: ${formData.segurancaPortaBlindada ? "☑" : "☐"} | Outras Medidas: ${formData.segurancaOutrasMedidas ? "☑" : "☐"}`,
        15,
        yPosition
      );
      yPosition += 8;

      // Seção Resultados
      doc.setFont(undefined as any, "bold" as any);
      doc.text("AVALIAÇÃO", 15, yPosition);
      yPosition += 5;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(`Pontuação Total: ${formData.pontuacao} pontos`, 15, yPosition);
      yPosition += 4;
      doc.text(`Classificação NEOP: ${formData.neop}`, 15, yPosition);
      yPosition += 4;
      doc.text(`Grau de Complexidade: ${formData.complexidade}`, 15, yPosition);
      yPosition += 8;

      // Parecer
      if (formData.parecer) {
        doc.setFont(undefined as any, "bold" as any);
        doc.text("PARECER", 15, yPosition);
        yPosition += 4;
        doc.setFont(undefined as any, "normal" as any);
        const pareceLines = doc.splitTextToSize(formData.parecer, pageWidth - 30);
        doc.text(pareceLines, 15, yPosition);
        yPosition += pareceLines.length * 4 + 5;
      }

      // Rodapé
      yPosition = pageHeight - 15;
      doc.setFont(undefined as any, "normal" as any);
      doc.setFontSize(9);
      doc.text(`Avaliador: ${formData.avaliador || "_______________"}`, 15, yPosition);
      doc.text(`Data: ${formData.dataAvaliacao || "_______________"}`, pageWidth / 2, yPosition);

      // Salvar PDF
      doc.save(`AVAL_OPS_${docNumber || new Date().getTime()}.pdf`);
      setIsGenerating(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsGenerating(false);
    }
  };

  return { downloadFormPdf, isGenerating };
};
