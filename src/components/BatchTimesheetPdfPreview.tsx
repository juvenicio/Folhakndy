"use client";

import React, { useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import BatchTimesheetPdfDocument from "./BatchTimesheetPdfDocument";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { DailyRecord, Employee } from "@/types"; // Importando as interfaces

interface BatchTimesheetData {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
}

interface BatchTimesheetPdfPreviewProps {
  batchData: BatchTimesheetData[];
  logoSrc: string | null;
}

const BatchTimesheetPdfPreview = ({ batchData, logoSrc }: BatchTimesheetPdfPreviewProps) => {
  const isMobile = useIsMobile();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdfDirect = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = <BatchTimesheetPdfDocument
        batchData={batchData}
        logoSrc={logoSrc}
      />;
      const blob = await pdf(doc).toBlob();
      const filename = `Folhas_de_Ponto_Lote_${batchData[0]?.month}_${batchData[0]?.year}.pdf`;
      saveAs(blob, filename);
      toast.success("PDF em lote baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar e baixar o PDF em lote:", error);
      toast.error("Erro ao gerar e baixar o PDF em lote.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!batchData || batchData.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado para pré-visualizar em lote.</div>;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-full text-center">
        <p className="text-lg mb-4">
          A pré-visualização de PDF não está disponível diretamente em dispositivos móveis.
          Por favor, clique no botão abaixo para baixar o documento em lote.
        </p>
        <Button onClick={handleDownloadPdfDirect} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-bounce" />
              Gerando PDF em lote...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF em Lote
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="800px" style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
      <BatchTimesheetPdfDocument
        batchData={batchData}
        logoSrc={logoSrc}
      />
    </PDFViewer>
  );
};

export default BatchTimesheetPdfPreview;