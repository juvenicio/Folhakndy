/** @jsxRuntime classic */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO, isValid, getDay, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../utils/pdfFonts'; // Importar o registro de fontes
import { DailyRecord, Employee } from "@/types"; // Importando as interfaces

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 36.00,    // 1.27 cm
    paddingRight: 36.00,  // 1.27 cm
    paddingBottom: 36.00, // 1.27 cm
    paddingLeft: 36.00,   // 1.27 cm
    fontSize: 8, // Tamanho da fonte base para o conteúdo
    fontFamily: 'Calibri', // Usar Calibri
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
    borderTopWidth: 1.5, // Explicit outer top border
    borderRightWidth: 1.5, // Explicit outer right border
    borderBottomWidth: 1.5, // Explicit outer bottom border
    borderLeftWidth: 1.5, // Explicit outer left border
    borderColor: '#000000',
    borderStyle: 'solid',
    flexGrow: 1, // Adicionado para ocupar o espaço restante
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  infoCellBase: {
    borderTopWidth: 1.5, // Internal top border
    borderLeftWidth: 1.5, // Internal left border
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  tableHeaderCell: {
    borderTopWidth: 1.5, // Internal top border
    borderLeftWidth: 1.5, // Internal left border
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
  colDia: { width: '5%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '10%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  colSignature: { width: '30%', padding: 1, textAlign: 'center', fontSize: 9, fontFamily: 'Calibri' },
  colSignatureLast: { width: '25%', padding: 1, textAlign: 'center', fontSize: 9, fontFamily: 'Calibri' },
  
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

interface TimesheetPdfDocumentV3Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfDocumentV3 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentV3Props) => {
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

  // Função para limpar o prefixo 'Apoio (Função):' se ele já estiver na string
  const getCleanFunction = (func: string | null) => {
    if (!func) return '';
    const prefix = "Apoio (Função): ";
    if (func.startsWith(prefix)) {
      return func.substring(prefix.length);
    }
    return func;
  };

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
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, borderRightWidth: 0, paddingLeft: 10 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Unidade escolar: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Nome: {employee.name}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '66.66%', borderLeftWidth: 0 }]}> {/* Ajustado para 66.66% */}
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Apoio (Função): {getCleanFunction(employee.function)}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}> {/* Ajustado para 33.33% e removido borderRightWidth */}
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Vínculo: {employee.vinculo}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Mês: {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.tableHeaderCell, { width: '5%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dia</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '10%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '10%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '30%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA/JUSTIFICATIVA</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '10%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '10%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>ASSINATURA/JUSTIFICATIVA</Text>
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

          const displayTime = (time: string | null) => {
            if (isWorkDayConfigured) {
              return formatTimeForDisplay(time);
            }
            // For non-work days, display '-' if no time is recorded
            return time ? formatTimeForDisplay(time) : '-';
          };

          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.infoCellBase, styles.colDia, { borderLeftWidth: 0 }]}>{day}</Text>
              <Text style={[styles.infoCellBase, styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }]}>{displayTime(record?.entry_time_1)}</Text>
              <Text style={[styles.infoCellBase, styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }]}>{displayTime(record?.exit_time_1)}</Text>
              <Text style={[styles.infoCellBase, styles.colSignature, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }]}>{displayTime(record?.entry_time_2)}</Text>
              <Text style={[styles.infoCellBase, styles.colTime, { fontFamily: 'Calibri', fontSize: 8 }]}>{displayTime(record?.exit_time_2)}</Text>
              <Text style={[styles.infoCellBase, styles.colSignatureLast, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText, { borderRightWidth: 0 }]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '33.33%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias Trabalhados:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Aulas:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Faltas:</Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', padding: 3, borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: 0, minHeight: 60 }]}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Calibri-Bold', fontSize: 9 }]}>Obs:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
        </View>
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9, width: '40%', textAlign: 'center' }}>Campina Grande; ____/____/____</Text>
        <View style={{ width: '40%', textAlign: 'center' }}>
          <Text style={{ width: '100%', textAlign: 'center', fontSize: 9, fontFamily: 'Calibri-Bold' }}>_________________________________________</Text>
          <Text style={{ fontSize: 9, fontFamily: 'Calibri-Bold' }}>Assinatura do(a) Gestor(a)</Text>
        </View>
      </View>
    </Page>
  );
};

export default TimesheetPdfDocumentV3;