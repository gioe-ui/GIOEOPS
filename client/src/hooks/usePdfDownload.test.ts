import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfDownload, type FormDataForPdf } from "./usePdfDownload";

describe("usePdfDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with isGenerating as false", () => {
    const { result } = renderHook(() => usePdfDownload());
    expect(result.current.isGenerating).toBe(false);
  });

  it("should have downloadFormPdf function", () => {
    const { result } = renderHook(() => usePdfDownload());
    expect(typeof result.current.downloadFormPdf).toBe("function");
  });

  it("should generate PDF with form data", async () => {
    const { result } = renderHook(() => usePdfDownload());

    const mockFormData: FormDataForPdf = {
      pocPosto: "Sargento",
      pocNome: "João Silva",
      pocContacto: "912345678",
      despacho: "Despacho de teste",
      cterRequerente: "CT Lisboa",
      mandadoDetencao: true,
      mandadoBusca: false,
      quantidadeSuspeitos: "1",
      modalidadeIsolado: true,
      modalidadeAssociacao: false,
      tipoCriminal: "trafico",
      antecedentesContraPessoas: true,
      antecedentesContraPatrimonio: false,
      antecedentesOutros: false,
      antecedentesFSS: "nao",
      posseArma: "registada",
      usoArma: "haRegisto",
      tipologiaApartamento: true,
      tipologiaMoradia: false,
      tipologiaOutro: false,
      contextoIsolado: true,
      contextoBairroSocial: false,
      contextoMeioUrbano: false,
      contextoMeioRural: false,
      segurancaCaes: true,
      segurancaPortaBlindada: false,
      segurancaOutrasMedidas: false,
      avaliador: "Avaliador Teste",
      dataAvaliacao: "2026-04-07",
      parecer: "Parecer de teste",
      pontuacao: 45,
      neop: "2º NEOP",
      complexidade: "Baixa",
    };

    // Mock the download functionality
    const mockSave = vi.fn();
    global.jsPDF = vi.fn(() => ({
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      },
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      splitTextToSize: vi.fn(() => []),
      save: mockSave,
    })) as any;

    await act(async () => {
      await result.current.downloadFormPdf(mockFormData, "TEST_DOC_001");
    });

    // Verify that save was called
    expect(mockSave).toHaveBeenCalled();
  });

  it("should handle PDF generation errors gracefully", async () => {
    const { result } = renderHook(() => usePdfDownload());

    const mockFormData: FormDataForPdf = {
      pocPosto: "Sargento",
      pocNome: "João Silva",
      pocContacto: "912345678",
      despacho: "Despacho de teste",
      cterRequerente: "CT Lisboa",
      mandadoDetencao: true,
      mandadoBusca: false,
      quantidadeSuspeitos: "1",
      modalidadeIsolado: true,
      modalidadeAssociacao: false,
      tipoCriminal: "trafico",
      antecedentesContraPessoas: true,
      antecedentesContraPatrimonio: false,
      antecedentesOutros: false,
      antecedentesFSS: "nao",
      posseArma: "registada",
      usoArma: "haRegisto",
      tipologiaApartamento: true,
      tipologiaMoradia: false,
      tipologiaOutro: false,
      contextoIsolado: true,
      contextoBairroSocial: false,
      contextoMeioUrbano: false,
      contextoMeioRural: false,
      segurancaCaes: true,
      segurancaPortaBlindada: false,
      segurancaOutrasMedidas: false,
      avaliador: "Avaliador Teste",
      dataAvaliacao: "2026-04-07",
      parecer: "Parecer de teste",
      pontuacao: 45,
      neop: "2º NEOP",
      complexidade: "Baixa",
    };

    // Mock jsPDF to throw an error
    global.jsPDF = vi.fn(() => {
      throw new Error("jsPDF initialization failed");
    }) as any;

    const alertSpy = vi.spyOn(global, "alert").mockImplementation(() => {});

    await act(async () => {
      await result.current.downloadFormPdf(mockFormData, "TEST_DOC_001");
    });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Erro ao gerar PDF"));
    alertSpy.mockRestore();
  });
});
