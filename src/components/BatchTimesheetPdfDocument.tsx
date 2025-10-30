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
import { normalizeString } from '@/lib/utils';

// Definindo as interfaces para os dados
interface DailyRecord {
  id: string;
  record_date: string; // ISO date string
  entry_time_1: string | null;
  exit_time_1: string | null;
  entry_time_2: string | null;
  exit_time_2: string | null;
  total_hours_worked: number | null;
  notes: string | null;
}

interface Employee {
  id: string;
  name: string;
  employee_type: string;
  function: string;
  registration_number: string;
  school_name: string | null;
  work_days: string[];
  shift: string[] | null;
  vinculo: string;
  discipline: string | null;
  weekly_hours: number | null;
}

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

    if (currentEmployeeType === "Professor Fundamental II" && (currentEmployeeVinculo === "Prestador(a) de Serviços" || currentEmployeeVinculo === "Contrato")) {
      return TimesheetPdfDocumentV5;
    } else if (currentEmployeeVinculo === "Educador Voluntário") {
      return TimesheetPdfDocumentV4;
    } else if (normalizedCurrentFunction.includes("asg") && currentEmployeeVinculo === "Contrato") {
      return TimesheetPdfDocumentV3;
    } else if (currentEmployeeType === "Professor" && currentEmployeeVinculo === "Contrato") {
      return TimesheetPdfDocumentV2;
    } else {
      const isV2Role = ["Professor", "Assistente Social", "Psicólogo(a)", "Gestor(a)"].includes(currentEmployeeType || "");
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