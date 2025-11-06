/** @jsxRuntime classic */
import * as React from 'react'; // Alterado para import * as React
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
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  headerContainer: {
    flexDirection: 'column', // Alterado para coluna
    alignItems: 'center',    // Centraliza horizontalmente
    marginBottom: 5,
    width: '100%',
  },
  headerTextContent: {
    width: '100%',
    textAlign: 'center', // Centraliza o texto dentro do seu espaço
    marginTop: 5, // Espaçamento entre logo e texto
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
    borderWidth: 1.5, // Alterado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
    flexGrow: 1, // Adicionado para ocupar o espaço restante
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
    alignItems: 'stretch', // Alterado para stretch
    fontSize: 8,
    fontFamily: 'Calibri',
    minHeight: 15, // Adicionado minHeight
  },
  tableHeaderCell: {
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'stretch', // Alterado para stretch
    fontSize: 8,
    minHeight: 15,
    fontFamily: 'Calibri',
  },
  colDia: { width: '5%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  colAula: { width: '15.83%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  colAulaLast: { width: '15.83%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  
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

interface TimesheetPdfDocumentV5Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfDocumentV5 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentV5Props) => {
  const monthName = format(new Date(year, month - 1), "MMMM", { locale: ptBR });
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const getShiftMark = (employeeShifts: string[] | null, currentShift: "Manhã" | "Tarde" | "Noite") => {
    return employeeShifts?.includes(currentShift) ? 'X' : ' ';
  };

  const getWorkDayMark = (employeeWorkDays: string[], dayOfWeekEnglish: string) => {
    return employeeWorkDays.includes(dayOfWeekEnglish) ? 'X' : ' ';
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
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '60%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Nome do(a) Professor(a): {employee.name}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '40%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Vínculo: {employee.vinculo}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '50%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Ano: {year}</Text>
          </Text>
        </View>
        {/* Linha para Disciplina, Carga Horária Semanal e Turno */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '33.33%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Disciplina: {employee.discipline || 'N/A'}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%' }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Carga Horária Semanal: {employee.weekly_hours ? `${employee.weekly_hours} H` : 'N/A'}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </Text>
        </View>
        {/* Linha para Dias, Mês e Ano (conforme o segundo print) */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '66.66%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>
              Dias: ({getWorkDayMark(employee.work_days, "Monday")}) Seg ({getWorkDayMark(employee.work_days, "Tuesday")}) Ter ({getWorkDayMark(employee.work_days, "Wednesday")}) Qua ({getWorkDayMark(employee.work_days, "Thursday")}) Qui ({getWorkDayMark(employee.work_days, "Friday")}) Sex
            </Text>
          </View>
          <View style={[styles.infoCellBase, { width: '16.67%' }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '16.67%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 9 }}>Ano: {year}</Text>
          </Text>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.cellBase, styles.headerCell, { width: '5%', borderLeftWidth: 0, borderTopWidth: 0 }]}>
            <Text>DIA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderTopWidth: 0 }]}>
            <Text>1º AULA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderTopWidth: 0 }]}>
            <Text>2ª AULA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderTopWidth: 0 }]}>
            <Text>3ª AULA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderTopWidth: 0 }]}>
            <Text>4ª AULA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderTopWidth: 0 }]}>
            <Text>5ª AULA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '15.83%', borderRightWidth: 0, borderTopWidth: 0 }]}>
            <Text>6ª AULA</Text>
          </View>
        </View>

        {/* Linhas de Registros Diários */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
          const record = dailyRecords.find(r => {
            const recordDate = isValid(parseISO(r.record_date)) ? parseISO(r.record_date) : null;
            return recordDate && recordDate.getDate() === day;
          });
          
          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.infoCellBase, styles.colDia, { borderLeftWidth: 0 }]}>{day}</Text>
              <Text style={[styles.infoCellBase, styles.colAula, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colAula, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colAula, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colAula, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colAula, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colAulaLast, { fontFamily: 'Calibri', fontSize: 8 }, displayNotes !== '' && styles.boldText, { borderRightWidth: 0 }]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '33.33%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias trabalhados:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de aulas:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de faltas:</Text>
          </Text>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', padding: 3, borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: 0 }]}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Calibri-Bold', fontSize: 9 }]}>Obs:</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, minHeight: 15, borderBottomWidth: 0, borderRightWidth: 0 }]}>
            <Text></Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: 0, minHeight: 15 }]}>
            <Text></Text>
          </View>
        </View>
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9, width: '40%', textAlign: 'center' }}>Campina Grande, ____/____/____</Text>
        <View style={{ width: '40%', textAlign: 'center' }}>
          <Text style={{ width: '100%', textAlign: 'center', fontSize: 9, fontFamily: 'Calibri-Bold' }}>_______________________________________________</Text>
          <Text style={{ fontSize: 9, fontFamily: 'Calibri-Bold' }}>Assinatura do(a) Gestor(a)</Text>
        </View>
      </View>
    </Page>
  );
};

export default TimesheetPdfDocumentV5;