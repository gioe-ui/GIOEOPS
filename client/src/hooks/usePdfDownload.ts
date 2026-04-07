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
      const lineHeight = 7; // Espaçamento maior entre linhas
      let yPosition = 12;

      // ===== CABEÇALHO =====
      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text("MINISTÉRIO DA ADMINISTRAÇÃO INTERNA", leftMargin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(14);
      doc.setFont(undefined as any, "bold" as any);
      doc.text("GUARDA NACIONAL REPUBLICANA", leftMargin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text("UNIDADE DE INTERVENÇÃO", leftMargin, yPosition);
      yPosition += lineHeight;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("GRUPO DE INTERVENÇÃO DE OPERAÇÕES ESPECIAIS", leftMargin, yPosition);
      yPosition += lineHeight + 2;

      doc.setFont(undefined as any, "bold" as any);
      doc.setFontSize(12);
      doc.text("AVALIAÇÃO DE PEDIDO DE APOIO", leftMargin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont(undefined as any, "normal" as any);
      doc.text(`DOC N.º ${docNumber || "GIOE_" + new Date().getTime()}`, leftMargin, yPosition);
      yPosition += lineHeight + 3;

      // ===== POC E DESPACHO =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("POC (posto, nome e função)", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);
      doc.text("| |", leftMargin, yPosition);
      yPosition += lineHeight + 2;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("DESPACHO", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);
      if (formData.despacho) {
        const despachoLines = doc.splitTextToSize(formData.despacho, pageWidth - 30);
        doc.text(despachoLines, leftMargin, yPosition);
        yPosition += despachoLines.length * lineHeight + 2;
      }
      yPosition += lineHeight;

      doc.setFont(undefined as any, "bold" as any);
      doc.text("CTer Requerente", leftMargin, yPosition);
      yPosition += lineHeight + 2;

      // ===== SUSPEITOS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("SUSPEITO(S)", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);

      // Mostrar apenas suspeitos selecionados
      if (formData.mandadoDetencao) {
        doc.text("Mandado de Detenção: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.mandadoBusca) {
        doc.text("Mandado de Busca: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.quantidadeSuspeitos) {
        doc.text(`Quantidade: ${formData.quantidadeSuspeitos}`, leftMargin, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;

      // ===== ATIVIDADE CRIMINAL =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("ATIVIDADE CRIMINAL", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);

      if (formData.modalidadeIsolado) {
        doc.text("Isolado: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.modalidadeAssociacao) {
        doc.text("Associação Criminosa: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.tipoCriminal) {
        doc.text(`Tipo Criminal: ${formData.tipoCriminal}`, leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.antecedentesContraPessoas) {
        doc.text("Antecedentes contra Pessoas: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.antecedentesContraPatrimonio) {
        doc.text("Antecedentes contra Patrimônio: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.antecedentesOutros) {
        doc.text("Antecedentes Outros: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.antecedentesFSS) {
        doc.text(`Antecedentes contra FSS: &`, leftMargin, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;

      // ===== MEIOS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("MEIOS", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);

      if (formData.posseArma) {
        const posseLabel = 
          formData.posseArma === "registada" ? "Posse de Arma - Registada: &" :
          formData.posseArma === "provavel" ? "Posse de Arma - Provável: &" :
          formData.posseArma === "improvavel" ? "Posse de Arma - Improvável: &" : "";
        if (posseLabel) {
          doc.text(posseLabel, leftMargin, yPosition);
          yPosition += lineHeight;
        }
      }
      if (formData.usoArma) {
        const usoLabel = 
          formData.usoArma === "haRegisto" ? "Uso de Arma - Há Registo: &" :
          formData.usoArma === "naoHaRegisto" ? "Uso de Arma - Não há Registo: &" : "";
        if (usoLabel) {
          doc.text(usoLabel, leftMargin, yPosition);
          yPosition += lineHeight;
        }
      }
      yPosition += lineHeight;

      // ===== LOCAL =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("LOCAL", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);

      if (formData.tipologiaApartamento) {
        doc.text("Tipologia - Apartamento: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.tipologiaMoradia) {
        doc.text("Tipologia - Moradia: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.tipologiaOutro) {
        doc.text("Tipologia - Outro: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }

      if (formData.contextoIsolado) {
        doc.text("Contexto - Isolado: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.contextoBairroSocial) {
        doc.text("Contexto - Bairro Social: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.contextoMeioUrbano) {
        doc.text("Contexto - Meio Urbano: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.contextoMeioRural) {
        doc.text("Contexto - Meio Rural: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;

      // ===== CARACTERÍSTICAS =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("CARACTERÍSTICAS", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);

      if (formData.segurancaCaes) {
        doc.text("Cães: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.segurancaPortaBlindada) {
        doc.text("Porta Blindada: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      if (formData.segurancaOutrasMedidas) {
        doc.text("Outras Medidas: &", leftMargin, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight;

      // ===== AVALIAÇÃO =====
      doc.setFont(undefined as any, "bold" as any);
      doc.text("AVALIAÇÃO", leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined as any, "normal" as any);
      doc.text(`Pontuação Total: ${formData.pontuacao} pontos`, leftMargin, yPosition);
      yPosition += lineHeight;
      doc.text(`Classificação NEOP: ${formData.neop}`, leftMargin, yPosition);
      yPosition += lineHeight;
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
