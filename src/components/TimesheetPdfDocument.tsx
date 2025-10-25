/** @jsxRuntime classic */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO, isValid, getDay, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '../utils/pdfFonts'; // Importar o registro de fontes

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
  name: string;
  employee_type: string; // Novo: "Cargo"
  function: string; // Existente: "Função"
  registration_number: string;
  school_name: string | null; // Alterado para permitir null
  work_days: string[];
  shift: string[] | null; // Alterado para array de strings
  vinculo: string; // Novo: "Tipo de Vínculo"
}

interface TimesheetPdfDocumentProps {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null; // Nova prop para a imagem do logo em base64
}

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: 17,    // 0.61 cm = ~17 pt
    paddingRight: 40,  // 1.4 cm = ~40 pt
    paddingBottom: 13, // 0.46 cm = ~13 pt
    paddingLeft: 47,   // 1.67 cm = ~47 pt
    fontSize: 8, // Tamanho da fonte base para o conteúdo
    fontFamily: 'Calibri', // Usar Calibri
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // Reduzido o espaçamento
    width: '100%',
  },
  headerTextContent: {
    flexGrow: 1,
    marginLeft: 10,
    textAlign: 'left',
  },
  headerText: {
    fontSize: 11, // Tamanho 11
    fontWeight: 'bold', // Negrito
    marginBottom: 1, // Reduzido o espaçamento entre linhas do cabeçalho
    fontFamily: 'Calibri-Bold', // Usar Calibri-Bold
  },
  headerTitle: {
    fontSize: 10,
    marginBottom: 3, // Reduzido o espaçamento
  },
  // Estilo base para as seções da tabela que se conectam verticalmente
  // Agora define a borda externa completa para a seção da tabela
  tableSectionBase: {
    display: 'table',
    width: 'auto',
    marginBottom: 0,
    borderWidth: 1.5, // Aumentado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  // Estilos para as células de detalhes do funcionário
  infoCellBase: {
    borderRightWidth: 1.5, // Aumentado para 1.5
    borderBottomWidth: 1.5, // Aumentado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri', // Usar Calibri
  },
  // Estilos para as células do cabeçalho da folha de ponto
  tableHeaderCell: {
    borderRightWidth: 1.5, // Aumentado para 1.5
    borderBottomWidth: 1.5, // Aumentado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    minHeight: 15,
    fontFamily: 'Calibri', // Usar Calibri
  },

  // Specific widths for each column in the main timesheet table
  colDia: { width: '5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '12.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colSignature: { width: '22.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 9, fontFamily: 'Calibri' },
  colExtraTime: { width: '12.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },

  // Estilos para a linha de resumo
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    // A borda externa será tratada pelo tableSectionBase
  },
  summaryCell: {
    borderRightWidth: 1.5, // Aumentado para 1.5
    borderBottomWidth: 1.5, // Aumentado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
    width: '33.33%',
    padding: 3,
    textAlign: 'left',
    fontSize: 8,
    fontFamily: 'Calibri', // Usar Calibri
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  // Estilos para as seções de observação/justificativa
  observationSection: {
    // Será envolvido por tableSectionBase
  },
  sectionTitle: {
    fontSize: 9,
    marginBottom: 3,
    fontFamily: 'Calibri', // Usar Calibri
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
    width: 40,
    height: 40,
  },
});

const TimesheetPdfDocument = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentProps) => {
  const monthName = format(new Date(year, month - 1), "MMMM", { locale: ptBR });
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const daysOfWeekMapForDisplay: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
  };
  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const getShiftMark = (employeeShifts: string[] | null, currentShift: "Manhã" | "Tarde" | "Noite") => {
    return employeeShifts?.includes(currentShift) ? 'X' : ' ';
  };

  // Função para formatar o tempo completo (HH:MM:SS)
  const formatFullTime = (timeString: string | null): string => {
    if (timeString === null || timeString === '') return ''; // Retorna string vazia para null ou vazio
    if (timeString === '-') return '-'; // Mantém o '-' se for explicitamente passado como '-'
    const [h, m] = timeString.split(':');
    if (h === undefined || m === undefined) return ''; // Se a análise falhar, retorna string vazia
    return `${h}:${m}:00`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header com Logo e Texto */}
        <View style={styles.headerContainer}>
          {logoSrc && <Image src={logoSrc} style={styles.logo} />} {/* Usa a string base64 do logo */}
          <View style={styles.headerTextContent}>
            <Text style={styles.headerText}>ESTADO DA PARAÍBA</Text>
            <Text style={styles.headerText}>PREFEITURA MUNICIPAL DE CAMPINA GRANDE</Text>
            <Text style={styles.headerText}>SECRETARIA MUNICIPAL DE EDUCAÇÃO DE CAMPINA GRANDE</Text>
            <Text style={styles.headerText}>DIRETORIA ADMINISTRATIVA FINANCEIRA/GERÊNCIA DE RECURSOS HUMANOS</Text>
          </View>
        </View>

        {/* Tabela de Detalhes do Funcionário */}
        <View style={styles.tableSectionBase}> {/* Outer border for this table */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', fontSize: 10, borderRightWidth: 0 }]}> {/* Last cell in row */}
              <Text style={{ flexGrow: 0 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text> {/* Usando employee.school_name, com fallback */}
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '66.66%', fontSize: 10 }]}>
              <Text style={{ flexGrow: 0 }}>Servidor(a): {employee.name}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}> {/* Last cell in row */}
              <Text style={{ flexGrow: 0 }}>Matrícula: {employee.registration_number}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '33.33%' }]}>
              <Text style={{ flexGrow: 0 }}>Cargo: {employee.employee_type}</Text> {/* Campo 'Cargo' */}
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%' }]}>
              <Text style={{ flexGrow: 0 }}>Função: {employee.vinculo}</Text> {/* Campo 'Vínculo' agora com rótulo 'Função' */}
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}> {/* Last cell in row */}
              <Text style={{ flexGrow: 0 }}>Turno: {employee.function}</Text> {/* Usando employee.function, agora com rótulo 'Turno' */}
            </View>
          </View>
          <View style={styles.tableRow}> {/* This is the last row of this table */}
            <View style={[styles.infoCellBase, { width: '33.33%', borderBottomWidth: 0 }]}> {/* Last row cell */}
              <Text style={{ flexGrow: 0 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%', borderBottomWidth: 0 }]}> {/* Last row cell */}
              <Text style={{ flexGrow: 0 }}>Mês: {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0, borderBottomWidth: 0 }]}> {/* Last cell in row AND last row cell */}
              <Text style={{ flexGrow: 0 }}>Ano: {year}</Text>
            </View>
          </View>
        </View>

        {/* Tabela Principal da Folha de Ponto */}
        <View style={styles.tableSectionBase}>
          <View style={styles.tableRow}>
            {/* Dia */}
            <View style={[styles.tableHeaderCell, { width: '5%' }]}>
              <Text>Dia</Text>
            </View>
            {/* Entrada 1 */}
            <View style={[styles.tableHeaderCell, { width: '12.5%' }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Entrada</Text>
              <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
            </View>
            {/* Assinatura 1 */}
            <View style={[styles.tableHeaderCell, { width: '22.5%' }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>ASSINATURA/JUSTIFICATIVA</Text>
            </View>
            {/* Saída 1 */}
            <View style={[styles.tableHeaderCell, { width: '12.5%' }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Saída</Text>
              <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
            </View>
            {/* Assinatura 2 */}
            <View style={[styles.tableHeaderCell, { width: '22.5%' }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>ASSINATURA/JUSTIFICATIVA</Text>
            </View>
            {/* Hora Extra - Nested View to simulate column and row span */}
            <View style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0, flexDirection: 'column', padding: 0, borderBottomWidth: 0 }]}> {/* Last cell in header row, remove bottom border here */}
              <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 0, minHeight: 15, width: '100%' }}> {/* No bottom border here */}
                <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Hora Extra</Text>
              </View>
              <View style={{ flexDirection: 'row', width: '100%', flexGrow: 1 }}>
                <View style={[styles.tableHeaderCell, { width: '50%', borderBottomWidth: 0, borderTopWidth: 1.5, borderTopColor: '#000000', borderTopStyle: 'solid' }]}> {/* Add top border */}
                  <Text style={{ fontSize: 10, fontFamily: 'Calibri' }}>Entrada</Text>
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
                </View>
                <View style={[styles.tableHeaderCell, { width: '50%', borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 1.5, borderTopColor: '#000000', borderTopStyle: 'solid' }]}> {/* Add top border, last cell in nested row */}
                  <Text style={{ fontSize: 10, fontFamily: 'Calibri' }}>Saída</Text>
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Linhas de Registros Diários */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
            const record = dailyRecords.find(r => {
              const recordDate = isValid(parseISO(r.record_date)) ? parseISO(r.record_date) : null;
              return recordDate && recordDate.getDate() === day;
            });
            const currentDate = new Date(year, month - 1, day);
            const dayOfWeek = getDay(currentDate);
            const dayNameEnglish = daysOfWeekMapForComparison[dayOfWeek];
            const isWorkDayConfigured = employee.work_days.includes(dayNameEnglish);
            const dayNamePtBr = daysOfWeekMapForDisplay[dayOfWeek];

            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isLastRow = index === daysInMonth - 1;

            return (
              <View style={styles.tableRow} key={day}>
                <Text style={[styles.colDia, isLastRow && { borderBottomWidth: 0 }]}>{day}</Text>
                <Text style={[styles.colTime, isLastRow && { borderBottomWidth: 0 }]}>{formatFullTime(record?.entry_time_1 || (isWeekend || !isWorkDayConfigured ? '-' : ''))}</Text>
                <Text style={[styles.colSignature, isLastRow && { borderBottomWidth: 0 }]}>{isWeekend || !isWorkDayConfigured ? dayNamePtBr.toUpperCase() : ''}</Text>
                <Text style={[styles.colTime, isLastRow && { borderBottomWidth: 0 }]}>{formatFullTime(record?.exit_time_1 || (isWeekend || !isWorkDayConfigured ? '-' : ''))}</Text>
                <Text style={[styles.colSignature, isLastRow && { borderBottomWidth: 0 }]}>{isWeekend || !isWorkDayConfigured ? dayNamePtBr.toUpperCase() : ''}</Text>
                {/* Hora Extra Entrada */}
                <Text style={[styles.colExtraTime, isLastRow && { borderBottomWidth: 0 }]}>{formatFullTime(record?.entry_time_2)}</Text>
                {/* Hora Extra Saída */}
                <Text style={[styles.colExtraTime, { borderRightWidth: 0 }, isLastRow && { borderBottomWidth: 0 }]}>{formatFullTime(record?.exit_time_2)}</Text> {/* Last cell in row */}
              </View>
            );
          })}
        </View>

        {/* Linha de Resumo */}
        <View style={styles.tableSectionBase}>
          <View style={styles.tableRow}>
            <View style={[styles.summaryCell, { width: '33.33%', borderBottomWidth: 0 }]}> {/* Last row cell */}
              <Text style={{ flexGrow: 0 }}>Dias trabalhados:</Text>
              <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
            </View>
            <View style={[styles.summaryCell, { width: '33.33%', borderBottomWidth: 0 }]}> {/* Last row cell */}
              <Text style={{ flexGrow: 0 }}>Total de Faltas:</Text>
              <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
            </View>
            <View style={[styles.summaryCell, { width: '33.33%', borderRightWidth: 0, borderBottomWidth: 0 }]}> {/* Last cell in row AND last row cell */}
              <Text style={{ flexGrow: 0 }}>Quantidade de horas-extras:</Text>
              <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
            </View>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableSectionBase}>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', padding: 3, borderRightWidth: 0, borderBottomWidth: 0 }]}> {/* Last cell in row AND last row cell */}
              <Text style={[styles.sectionTitle, { flexGrow: 0 }]}>Observação:</Text>
              <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
            </View>
          </View>
        </View>

        {/* Seção de Justificativa/Horas Extras */}
        <View style={styles.tableSectionBase}>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', padding: 3, borderRightWidth: 0, borderBottomWidth: 0 }]}> {/* Last cell in row AND last row cell */}
              <Text style={[styles.sectionTitle, { flexGrow: 0 }]}>Justificativa/Horas Extras:</Text>
              <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10, width: '40%', textAlign: 'center' }}>Campina Grande, ____/____/____</Text>
          <View style={{ width: '40%', textAlign: 'center' }}>
            <Text style={{ width: '100%', textAlign: 'center', fontSize: 10, fontFamily: 'Calibri-Bold' }}>________________________________________</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Calibri-Bold' }}>Assinatura do(a) Gestor(a)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TimesheetPdfDocument;