/** @jsxRuntime classic */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO, isValid, getDay, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../utils/pdfFonts'; // Importar o registro de fontes

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 36.00,    // 1.27 cm
    paddingRight: 36.00,  // 1.27 cm
    paddingBottom: 36.00, // 1.27 cm
    paddingLeft: 36.00,   // 1.27 cm
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  mainTableContainer: {
    display: 'table',
    width: 'auto',
    marginBottom: 0,
    borderWidth: 1.5, // Borda externa da tabela principal
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  // Estilo base para todas as células dentro da tabela principal (info, resumo, observação)
  cellBase: {
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri',
    borderBottomWidth: 1.5, // Borda inferior padrão
    borderRightWidth: 1.5,  // Borda direita padrão
  },
  // Estilo para a célula de carga horária (100% de largura)
  centeredChargeHoursCell: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  // Estilo para células de cabeçalho da tabela de registros diários
  tableHeaderCell: {
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 15,
    fontFamily: 'Calibri-Bold', // Texto do cabeçalho em negrito
    fontSize: 9, // Tamanho da fonte do cabeçalho
  },
  // Estilos específicos para as colunas da tabela de registros diários
  colDia: { width: '5%', textAlign: 'center' },
  colTime: { width: '10%', textAlign: 'center' },
  colSignature: { width: '25%', textAlign: 'center' },
  colSignatureLast: { width: '30%', textAlign: 'center', borderRightWidth: 0 }, // Última coluna, sem borda direita
  
  sectionTitle: {
    fontSize: 9,
    marginBottom: 3,
    fontFamily: 'Calibri-Bold', // Títulos de seção em negrito
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: '40%',
    textAlign: 'center',
    fontSize: 8,
  },
  boldText: {
    fontFamily: 'Calibri-Bold',
  },
});

interface DailyRecord {
  id: string;
  record_date: string; // ISO date string
  entry_time_1: string | null;
  exit_time_1: string | null;
  entry_time_2: string | null; // Not used in V6, but kept for type consistency
  exit_time_2: string | null; // Not used in V6, but kept for type consistency
  total_hours_worked: number | null;
  notes: string | null;
}

interface Employee {
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

interface TimesheetPdfDocumentV6Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfDocumentV6 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentV6Props) => {
  const monthName = format(new Date(year, month - 1), "MMMM", { locale: ptBR });
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const getShiftMark = (employeeShifts: string[] | null, currentShift: "Manhã" | "Tarde" | "Noite") => {
    return employeeShifts?.includes(currentShift) ? 'X' : ' ';
  };

  const monthNameFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <Page size="A4" style={styles.page}>
      {/* Espaço em branco para o cabeçalho */}
      <View style={{ height: 70, marginBottom: 5 }} /> 

      {/* Tabela Principal Unificada */}
      <View style={styles.mainTableContainer}>
        {/* Row 1: Unidade de Trabalho */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Unidade de Trabalho: {employee?.school_name || 'N/A'}</Text>
          </View>
        </View>
        {/* Row 2: NOME */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>NOME: {employee?.name || 'N/A'}</Text>
          </View>
        </View>
        {/* Row 3: CARGA HORÁRIA */}
        <View style={styles.tableRow}>
          <View style={[styles.centeredChargeHoursCell, { borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>CARGA HORÁRIA: {employee?.weekly_hours ? `${employee.weekly_hours} HORAS` : 'N/A'}</Text>
          </View>
        </View>
        {/* Row 4: Turno, Mês e Ano */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '50%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Turno: ({getShiftMark(employee?.shift, "Manhã")}) Manhã ({getShiftMark(employee?.shift, "Tarde")}) Tarde ({getShiftMark(employee?.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.cellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.cellBase, { width: '25%', borderRightWidth: 0 }]}> {/* Last cell in row, no right border */}
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colDia]}>
            <Text>Dia</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colTime]}>
            <Text>Entrada</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colTime]}>
            <Text>Saída</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colSignature]}>
            <Text>ASSINATURA</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colTime]}>
            <Text>Entrada</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colTime]}>
            <Text>Saída</Text>
          </View>
          <View style={[styles.cellBase, styles.tableHeaderCell, styles.colSignatureLast]}> {/* Last cell in row, no right border */}
            <Text>ASSINATURA</Text>
          </View>
        </View>

        {/* Linhas de Registros Diários */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
          const record = dailyRecords.find(r => {
            const recordDate = isValid(parseISO(r.record_date)) ? parseISO(r.record_date) : null;
            return recordDate && recordDate.getDate() === day;
          });
          const currentDate = new Date(year, month - 1, day);
          const dayNameEnglish = daysOfWeekMapForComparison[getDay(currentDate)];
          const isWorkDayConfigured = employee?.work_days.includes(dayNameEnglish);

          const isLastDailyRecordRow = index === daysInMonth - 1;

          const displayTime = () => {
            // Para V6, os campos de hora devem estar vazios para preenchimento manual
            return ''; 
          };

          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.cellBase, styles.colDia, isLastDailyRecordRow && { borderBottomWidth: 0 }]}>{day}</Text>
              <Text style={[styles.cellBase, styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 0 }]}>{displayTime()}</Text>
              <Text style={[styles.cellBase, styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 0 }]}>{displayTime()}</Text>
              <Text style={[
                styles.cellBase, styles.colSignature,
                isLastDailyRecordRow && { borderBottomWidth: 0 },
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO") || displayNotes.includes("FERIADO")) && styles.boldText
              ]}>{displayNotes}</Text>
              <Text style={[styles.cellBase, styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 0 }]}>{displayTime()}</Text>
              <Text style={[styles.cellBase, styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 0 }]}>{displayTime()}</Text>
              <Text style={[
                styles.cellBase, styles.colSignatureLast,
                isLastDailyRecordRow && { borderBottomWidth: 0 }, // Last cell in row, no right border
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO") || displayNotes.includes("FERIADO")) && styles.boldText
              ]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '50%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias trabalhados:</Text>
          </View>
          <View style={[styles.cellBase, { width: '50%', borderRightWidth: 0 }]}> {/* Last cell in row, no right border */}
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Faltas:</Text>
          </View>
        </View>

        {/* Seção de Observação (Last row of the entire table) */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', borderRightWidth: 0, borderBottomWidth: 0, padding: 3, justifyContent: 'flex-start', minHeight: 60 }]}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Calibri-Bold', fontSize: 9 }]}>Obs:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
        </View>
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9, width: '40%', textAlign: 'center' }}>Campina Grande, ____/____/____</Text>
        <View style={{ width: '40%', textAlign: 'center' }}>
          <Text style={{ width: '100%', textAlign: 'center', fontSize: 9, fontFamily: 'Calibri-Bold' }}>_________________________________________</Text>
          <Text style={{ fontSize: 9, fontFamily: 'Calibri-Bold' }}>Assinatura do(a) Gestor(a)</Text>
        </View>
      </View>
    </Page>
  );
};

export default TimesheetPdfDocumentV6;