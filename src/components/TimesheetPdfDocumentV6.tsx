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
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  headerTextContent: {
    width: '100%',
    textAlign: 'center',
    marginTop: 5,
  },
  headerText: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 1,
    fontFamily: 'Calibri-Bold',
  },
  mainTableContainer: {
    display: 'table',
    width: 'auto',
    marginBottom: 0,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  infoCellBase: {
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
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
    borderRightWidth: 0,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderBottomWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeaderCell: {
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
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
  colDia: { width: '10%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '15%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colSignature: { width: '30%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colSignatureLast: { width: '30%', padding: 1, textAlign: 'center', borderRightWidth: 0, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  
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
  logo: {
    width: 24,
    height: 33,
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
  entry_time_2: string | null;
  exit_time_2: string | null;
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
  discipline: string | null; // Novo campo
  weekly_hours: number | null; // Novo campo
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
      {/* Header com Logo e Texto */}
      <View style={styles.headerContainer}>
        {logoSrc && <Image src={logoSrc} style={styles.logo} />}
        <View style={styles.headerTextContent}>
          <Text style={styles.headerText}>ESTADO DA PARAÍBA</Text>
          <Text style={styles.headerText}>PREFEITURA MUNICIPAL DE CAMPINA GRANDE</Text>
          <Text style={styles.headerText}>SECRETARIA DE EDUCAÇÃO</Text>
          <Text style={styles.headerText}>DIRETORIA ADMINISTRATIVA FINANCEIRA</Text>
          <Text style={styles.headerText}>GERÊNCIA DE RECURSOS HUMANOS</Text>
        </View>
      </View>

      {/* Tabela Principal */}
      <View style={styles.mainTableContainer}>
        {/* Detalhes do Funcionário */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, paddingLeft: 10 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>NOME: {employee.name}</Text>
          </View>
        </View>
        {/* Nova linha para CARGA HORÁRIA */}
        <View style={styles.tableRow}>
          <View style={styles.centeredChargeHoursCell}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>CARGA HORÁRIA: {employee.weekly_hours ? `${employee.weekly_hours} HORAS` : 'N/A'}</Text>
          </View>
        </View>
        {/* Linha para Turno, Mês e Ano */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.tableHeaderCell, styles.colDia]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dia</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignature]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignatureLast]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA</Text>
          </View>
        </View>

        {/* Linhas de Registros Diários */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
          const record = dailyRecords.find(r => {
            const recordDate = isValid(parseISO(r.record_date)) ? parseISO(r.record_date) : null;
            return recordDate && recordDate.getDate() === day;
          });
          
          const isLastDailyRecordRow = index === daysInMonth - 1;
          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.colDia, { fontFamily: 'Calibri', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{day}</Text>
              <Text style={[styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{formatTimeForDisplay(record?.entry_time_1)}</Text>
              <Text style={[styles.colSignature, { fontFamily: 'Calibri', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{formatTimeForDisplay(record?.exit_time_1)}</Text>
              <Text style={[styles.colSignatureLast, { fontFamily: 'Calibri', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias trabalhados:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '50%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Faltas:</Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', padding: 3, borderRightWidth: 0, borderBottomWidth: 0, minHeight: 60 }]}>
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