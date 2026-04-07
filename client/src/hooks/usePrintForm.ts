import { useState } from "react";

export const usePrintForm = () => {
  const [isPrinting, setIsPrinting] = useState(false);

  const printForm = (elementId: string) => {
    setIsPrinting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento do formulário não encontrado");
      }

      // Clonar elemento
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Criar janela de impressão
      const printWindow = window.open("", "", "height=800,width=1000");
      if (!printWindow) {
        throw new Error("Não foi possível abrir janela de impressão");
      }

      // Escrever conteúdo na janela
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>AVAL_OPS_GIOE</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                color: #000;
                background: #fff;
                padding: 20px;
                line-height: 1.6;
              }
              
              @media print {
                body {
                  padding: 0;
                }
              }
              
              .form-container {
                max-width: 900px;
                margin: 0 auto;
              }
              
              .form-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
              }
              
              .form-header img {
                max-width: 100px;
                height: auto;
                margin-bottom: 10px;
              }
              
              .form-header h1 {
                font-size: 24px;
                margin: 10px 0;
                color: #1a472a;
              }
              
              .form-header p {
                font-size: 14px;
                color: #666;
              }
              
              .form-section {
                margin-bottom: 20px;
              }
              
              .form-section h2 {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #1a472a;
                border-left: 4px solid #1a472a;
                padding-left: 10px;
              }
              
              .form-group {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
              }
              
              .checkbox {
                width: 16px;
                height: 16px;
                border: 1px solid #333;
                margin-right: 10px;
                display: inline-block;
                flex-shrink: 0;
              }
              
              .checkbox.checked::after {
                content: "✓";
                display: block;
                text-align: center;
                line-height: 16px;
                font-weight: bold;
              }
              
              .form-label {
                font-size: 14px;
                flex: 1;
              }
              
              .form-input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ccc;
                font-family: Arial, sans-serif;
                font-size: 14px;
                margin-bottom: 10px;
              }
              
              .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
              }
              
              .form-row-full {
                display: grid;
                grid-template-columns: 1fr;
                gap: 15px;
                margin-bottom: 15px;
              }
              
              .classification {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
              }
              
              .classification h3 {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              
              .classification-value {
                font-size: 16px;
                font-weight: bold;
                color: #1a472a;
              }
              
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                font-size: 12px;
                color: #666;
                text-align: right;
              }
              
              @media print {
                .no-print {
                  display: none !important;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="form-container">
              ${clonedElement.innerHTML}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setIsPrinting(false);
        }, 250);
      };

      // Fallback se onload não funcionar
      setTimeout(() => {
        setIsPrinting(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      alert(`Erro ao imprimir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      setIsPrinting(false);
    }
  };

  return { printForm, isPrinting };
};
