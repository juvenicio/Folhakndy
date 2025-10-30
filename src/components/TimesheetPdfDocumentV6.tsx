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
    borderTopWidth: 1.5, // Apenas borda superior e inferior para o container
    borderBottomWidth: 1.5,
    borderLeftWidth: 0, // As bordas laterais serão definidas pelas células
    borderRightWidth: 0, // As bordas laterais serão definidas pelas células
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  infoCellBase: {
    // Removido borderRightWidth e borderBottomWidth do estilo base
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  centeredChargeHoursCell: {
    width: '100%',
    // Removido borderRightWidth e borderBottomWidth do estilo base
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeaderCell: {
    // Removido borderRightWidth e borderBottomWidth do estilo base
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    minHeight: 15,
    fontFamily: 'Calibri',
  },
  colDia: { width: '5%', padding: 1, textAlign: 'center', borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '22.5%', padding: 1, textAlign: 'center', borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colSignature: { width: '22.5%', padding: 1, textAlign: 'center', borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colSignatureLast: { width: '22.5%', padding: 1, textAlign: 'center', borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  
  sectionTitle: {
    fontSize: 9,
    marginBottom: 3,
    fontFamily: 'Calibri',
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

  const formatTimeForDisplay = (timeString: string | null): string => {
    if (timeString === null || timeString === '') return '';
    return timeString; // Apenas retorna o HH:MM
  };

  const monthNameFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <Page size="A4" style={styles.page}>
      {/* Espaço em branco para o cabeçalho */}
      <View style={{ height: 70, marginBottom: 5 }} /> 

      {/* Tabela Principal */}
      <View style={styles.mainTableContainer}>
        {/* Detalhes do Funcionário */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', paddingLeft: 10, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderTopWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>NOME: {employee.name}</Text>
          </View>
        </View>
        {/* Nova linha para CARGA HORÁRIA */}
        <View style={styles.tableRow}>
          <View style={[styles.centeredChargeHoursCell, { borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>CARGA HORÁRIA: {employee.weekly_hours ? `${employee.weekly_hours} HORAS` : 'N/A'}</Text>
          </View>
        </View>
        {/* Linha para Turno, Mês e Ano */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.tableHeaderCell, styles.colDia, { borderLeftWidth: 1.5, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dia</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignature, { borderTopWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignatureLast, { borderTopWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA</Text>
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
          const isWorkDayConfigured = employee.work_days.includes(dayNameEnglish);

          const isLastDailyRecordRow = index === daysInMonth - 1;

          const displayTime = (time: string | null) => {
            if (isWorkDayConfigured) {
              return formatTimeForDisplay(time);
            }
            // Para dias não trabalhados, exibe '-' se não houver tempo registrado
            return time ? formatTimeForDisplay(time) : '-';
          };

          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.colDia, { fontFamily: 'Calibri', fontSize: 8, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>{day}</Text>
              <Text style={[styles.colTime, { fontFamily: 'Calibri', fontSize: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>{displayTime(record?.entry_time_1)}</Text>
              <Text style={[
                styles.colSignature,
                { fontFamily: 'Calibri', fontSize: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO") || displayNotes.includes("FERIADO")) && styles.boldText
              ]}>{displayNotes}</Text>
              <Text style={[styles.colTime, { fontFamily: 'Calibri', fontSize: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]}>{displayTime(record?.exit_time_1)}</Text>
              <Text style={[
                styles.colSignatureLast,
                { fontFamily: 'Calibri', fontSize: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO") || displayNotes.includes("FERIADO")) && styles.boldText
              ]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias trabalhados:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '50%', borderRightWidth: 1.5, borderBottomWidth: 1.5 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Faltas:</Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 1.5, borderRightWidth: 1.5, borderBottomWidth: 1.5, padding: 3, justifyContent: 'flex-start', minHeight: 60 }]}>
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