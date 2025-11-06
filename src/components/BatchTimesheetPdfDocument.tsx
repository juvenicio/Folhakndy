/** @jsxRuntime classic */
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO, isValid, getDay, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../utils/pdfFonts'; // Importar o registro de fontes

// Importar todos os modelos de PDF existentes
import TimesheetPdfDocument from './TimesheetPdfDocument';
import TimesheetPdfDocumentV2 from './TimesheetPdfDocumentV2';
import TimesheetPdfDocumentV3 from './TimesheetPdfDocumentV3';
import TimesheetPdfDocumentV4 from './TimesheetPdfDocumentV4';
import TimesheetPdfDocumentV5 from './TimesheetPdfDocumentV5';
import TimesheetPdfDocumentV6 from './TimesheetPdfDocumentV6'; // Importar o novo V6
import { normalizeString } from '@/lib/utils';
import { DailyRecord, Employee } from "@/types"; // Importando as interfaces

interface BatchTimesheetData {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
}

interface BatchTimesheetPdfDocumentProps {
  batchData: BatchTimesheetData[];
  logoSrc: string | null;
}

const BatchTimesheetPdfDocument = ({ batchData, logoSrc }: BatchTimesheetPdfDocumentProps) => {

  // Helper function to determine which PDF component to use
  const getPdfComponent = (employee: Employee) => {
    const normalizedCurrentFunction = normalizeString(employee.function);
    const currentEmployeeType = employee.employee_type;
    const currentEmployeeVinculo = employee.vinculo;

    // Prioridade 1: Professor com função Gestor(a) -> V2
    if (currentEmployeeType === "Professor" && normalizedCurrentFunction.includes("gestor")) {
      return TimesheetPdfDocumentV2;
    }
    // Prioridade 2: Educador Voluntário 20H -> V6
    else if (currentEmployeeVinculo === "Educador Voluntário 20H") {
      return TimesheetPdfDocumentV6;
    }
    // Prioridade 3: Professor Fundamental II com Prestador(a) de Serviços ou Contrato -> V5
    else if (currentEmployeeType === "Professor Fundamental II" && (currentEmployeeVinculo === "Prestador(a) de Serviços" || currentEmployeeVinculo === "Contrato")) {
      return TimesheetPdfDocumentV5;
    }
    // NOVA PRIORIDADE: Professor Fundamental II com Vínculo Efetivo -> V5
    else if (currentEmployeeType === "Professor Fundamental II" && currentEmployeeVinculo === "Efetivo") {
      return TimesheetPdfDocumentV5;
    }
    // Prioridade 4: Educador Voluntário (não 20H) -> V4
    else if (currentEmployeeVinculo === "Educador Voluntário") {
      return TimesheetPdfDocumentV4;
    }
    // Prioridade 5: Vigia (Contrato) com função Vigia ou ASG (Contrato) OU Psicólogo(a) (Contrato) com função Psicologa OU Nutricionista (Contrato) OU Merendeira (Contrato) OU Supervisor(a) (Contrato) com função Supervisora -> V3
    else if ((currentEmployeeType === "Vigia" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("vigia")) ||
             (normalizedCurrentFunction.includes("asg") && currentEmployeeVinculo === "Contrato") ||
             (currentEmployeeType === "Psicólogo(a)" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("psicologa")) ||
             (currentEmployeeType === "Nutricionista" && currentEmployeeVinculo === "Contrato") ||
             (currentEmployeeType === "Merendeira" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("merendeira")) ||
             (currentEmployeeType === "Supervisor(a)" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("supervisora"))) {
      return TimesheetPdfDocumentV3;
    }
    // Prioridade 6: Professor (Contrato) -> V2
    else if (currentEmployeeType === "Professor" && currentEmployeeVinculo === "Contrato") {
      return TimesheetPdfDocumentV2;
    }
    // Prioridade 7: Outros cargos específicos (Efetivo) -> V2
    else {
      const isV2Role = ["Professor", "Assistente Social", "Psicólogo(a)", "Gestor(a)", "Supervisor(a)"].includes(currentEmployeeType || "");
      const isEfetivo = currentEmployeeVinculo === "Efetivo";
      return (isV2Role && isEfetivo) ? TimesheetPdfDocumentV2 : TimesheetPdfDocument;
    }
  };

  return (
    <Document>
      {batchData.map((data, index) => {
        const PdfComponent = getPdfComponent(data.employee);
        return (
          <PdfComponent
            key={data.employee.id}
            employee={data.employee}
            month={data.month}
            year={data.year}
            dailyRecords={data.dailyRecords}
            logoSrc={logoSrc}
          />
        );
      })}
    </Document>
  );
};

export default BatchTimesheetPdfDocument;