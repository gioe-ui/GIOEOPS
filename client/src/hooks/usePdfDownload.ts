import jsPDF from "jspdf";
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

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      let yPosition = 12;

      // ===== CABEÇALHO =====
      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text("MINISTÉRIO DA ADMINISTRAÇÃO INTERNA", leftMargin, yPosition);
      yPosition += 5;

      doc.setFontSize(14);
      doc.setFont(undefined as any, "bold" as any);
      doc.text("GUARDA NACIONAL REPUBLICANA", leftMargin, yPosition);
      yPosition += 5;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text("UNIDADE DE INTERVENÇÃO", leftMargin, yPosition);
      yPosition += 4;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("GRUPO DE INTERVENÇÃO DE OPERAÇÕES ESPECIAIS", leftMargin, yPosition);
      yPosition += 7;

      doc.setFont(undefined as any, "bold" as any);
      doc.setFontSize(12);
      doc.text("AVALIAÇÃO DE PEDIDO DE APOIO", leftMargin, yPosition);
      yPosition += 4;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text(`DOC N.º ${docNumber || "GIOE_" + new Date().getTime()}`, leftMargin, yPosition);
      yPosition += 10;

      // ===== POC E DESPACHO =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("POC (posto, nome e função)", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text("| |", leftMargin, yPosition);
      yPosition += 6;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("DESPACHO", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      if (formData.despacho) {
        const despachoLines = doc.splitTextToSize(formData.despacho, pageWidth - 30);
        doc.text(despachoLines, leftMargin, yPosition);
        yPosition += despachoLines.length * 3 + 2;
      }
      yPosition += 2;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("CTer Requerente", leftMargin, yPosition);
      yPosition += 6;

      // ===== SUSPEITOS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("SUSPEITO(S)", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Mandado de Detenção: ${formData.mandadoDetencao ? "&" : ""} | Mandado de Busca: ${formData.mandadoBusca ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 4;
      doc.text(`Quantidade: ${formData.quantidadeSuspeitos || ""}`, leftMargin, yPosition);
      yPosition += 6;

      // ===== ATIVIDADE CRIMINAL =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("ATIVIDADE CRIMINAL", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Isolado: ${formData.modalidadeIsolado ? "&" : ""} | Associação Criminosa: ${formData.modalidadeAssociacao ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 3;
      doc.text(
        `Antecedentes contra Pessoas: ${formData.antecedentesContraPessoas ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 3;
      doc.text(
        `Antecedentes contra Patrimônio: ${formData.antecedentesContraPatrimonio ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 3;
      doc.text(
        `Antecedentes contra FSS: ${formData.antecedentesFSS ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 6;

      // ===== MEIOS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("MEIOS", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Posse de Arma - Registada: ${formData.posseArma === "registada" ? "&" : ""} | Provável: ${formData.posseArma === "provavel" ? "&" : ""} | Improvável: ${formData.posseArma === "improvavel" ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 3;
      doc.text(
        `Uso de Arma - Há Registo: ${formData.usoArma === "haRegisto" ? "&" : ""} | Não há Registo: ${formData.usoArma === "naoHaRegisto" ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 6;

      // ===== LOCAL =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("LOCAL", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Tipologia - Apartamento: ${formData.tipologiaApartamento ? "&" : ""} | Moradia: ${formData.tipologiaMoradia ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 3;
      doc.text(
        `Contexto - Isolado: ${formData.contextoIsolado ? "&" : ""} | Bairro Social: ${formData.contextoBairroSocial ? "&" : ""} | Meio Urbano: ${formData.contextoMeioUrbano ? "&" : ""} | Meio Rural: ${formData.contextoMeioRural ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 6;

      // ===== CARACTERÍSTICAS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("CARACTERÍSTICAS", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(
        `Cães: ${formData.segurancaCaes ? "&" : ""} | Porta Blindada: ${formData.segurancaPortaBlindada ? "&" : ""} | Outras Medidas: ${formData.segurancaOutrasMedidas ? "&" : ""}`,
        leftMargin,
        yPosition
      );
      yPosition += 6;

      // ===== AVALIAÇÃO =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("AVALIAÇÃO", leftMargin, yPosition);
      yPosition += 4;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(`Pontuação Total: ${formData.pontuacao} pontos`, leftMargin, yPosition);
      yPosition += 3;
      doc.text(`Classificação NEOP: ${formData.neop}`, leftMargin, yPosition);
      yPosition += 3;
      doc.text(`Grau de Complexidade: ${formData.complexidade}`, leftMargin, yPosition);

      // ===== RODAPÉ =====
      yPosition = pageHeight - 12;
      doc.setFont(undefined as any, "normal" as any);
      doc.setFontSize(9);
      doc.text(`Avaliador: ______________`, leftMargin, yPosition);
      doc.text(`Data: ${formData.dataAvaliacao || new Date().toISOString().split("T")[0]}`, pageWidth / 2, yPosition);

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

  return { downloadFormPdf, isGenerating };
};
