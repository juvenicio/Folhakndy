import React, { useState } from "react";
import { PDFViewer, pdf, Document } from "@react-pdf/renderer"; // Import Document
import TimesheetPdfDocumentV2 from "./TimesheetPdfDocumentV2";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { DailyRecord, Employee } from "@/types"; // Importando as interfaces

interface TimesheetPdfPreviewV2Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfPreviewV2 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfPreviewV2Props) => {
  const isMobile = useIsMobile();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdfDirect = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = (
        <Document>
          <TimesheetPdfDocumentV2
            employee={employee}
            month={month}
            year={year}
            dailyRecords={dailyRecords}
            logoSrc={logoSrc}
          />
        </Document>
      );
      const blob = await pdf(doc).toBlob();
      const filename = `Folha_de_Ponto_V2_${employee.name.replace(/\s/g, '_')}_${month}_${year}.pdf`;
      saveAs(blob, filename);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar e baixar o PDF:", error);
      toast.error("Erro ao gerar e baixar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!employee || dailyRecords.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado para pré-visualizar.</div>;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-full text-center">
        <p className="text-lg mb-4">
          A pré-visualização de PDF não está disponível diretamente em dispositivos móveis.
          Por favor, clique no botão abaixo para baixar o documento.
        </p>
        <Button onClick={handleDownloadPdfDirect} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-bounce" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="800px" style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
      <Document>
        <TimesheetPdfDocumentV2
          employee={employee}
          month={month}
          year={year}
          dailyRecords={dailyRecords}
          logoSrc={logoSrc}
        />
      </Document>
    </PDFViewer>
  );
};

export default TimesheetPdfPreviewV2;