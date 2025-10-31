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
    marginBottom: 5,
    width: '100%',
  },
  headerTextContent: {
    flexGrow: 1,
    marginLeft: 10,
    textAlign: 'left',
  },
  headerText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 1,
    fontFamily: 'Calibri-Bold',
  },
  // Estilo para a ÚNICA tabela que engloba tudo
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
  // Estilos para as células internas (bordas de 1.5pt)
  cellBase: {
    borderRightWidth: 1.5, // Aumentado para 1.5
    borderBottomWidth: 1.5, // Aumentado para 1.5
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri',
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
    fontFamily: 'Calibri',
  },

  // Specific widths for each column in the main timesheet table
  colDia: { width: '5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '15%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' }, // Ajustado de 12.5% para 15%
  colSignature: { width: '20%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 9, fontFamily: 'Calibri' }, // Ajustado de 22.5% para 20%
  colExtraTime: { width: '12.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' }, // Mantido em 12.5%

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
    if (timeString === null || timeString === '') return '';
    if (timeString === '-') return '-';
    const [h, m] = timeString.split(':');
    if (h === undefined || m === undefined) return '';
    return `${h}:${m}:00`;
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header com Logo e Texto */}
      <View style={styles.headerContainer}>
        {logoSrc && <Image src={logoSrc} style={styles.logo} />}
        <View style={styles.headerTextContent}>
          <Text style={styles.headerText}>ESTADO DA PARAÍBA</Text>
          <Text style={styles.headerText}>PREFEITURA MUNICIPAL DE CAMPINA GRANDE</Text>
          <Text style={styles.headerText}>SECRETARIA MUNICIPAL DE EDUCAÇÃO DE CAMPINA GRANDE</Text>
          <Text style={styles.headerText}>DIRETORIA ADMINISTRATIVA FINANCEIRA/GERÊNCIA DE RECURSOS HUMANOS</Text>
        </View>
      </View>

      {/* Única Tabela Principal que engloba Detalhes do Funcionário, Registros Diários e Resumo */}
      <View style={styles.mainTableContainer}>
        {/* Detalhes do Funcionário */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', fontSize: 10, borderRightWidth: 0 }]}>
            <Text style={{ flexGrow: 0 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '66.66%', fontSize: 10 }]}>
            <Text style={{ flexGrow: 0 }}>Servidor(a): {employee.name}</Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ flexGrow: 0 }}>Matrícula: {employee.registration_number}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '33.33%' }]}>
            <Text style={{ flexGrow: 0 }}>Cargo: {employee.employee_type}</Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%' }]}>
            <Text style={{ flexGrow: 0 }}>Função: {employee.function}</Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ flexGrow: 0 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '33.33%' }]}>
            <Text style={{ flexGrow: 0 }}>Vínculo: {employee.vinculo}</Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%' }]}>
            <Text style={{ flexGrow: 0 }}>Mês: {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%', borderRightWidth: 0 }]}>
            <Text style={{ flexGrow: 0 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários (FIXED) */}
        <View style={styles.tableRow} fixed>
          {/* Dia */}
          <View style={[styles.tableHeaderCell, { width: '5%' }]}>
            <Text>Dia</Text>
          </View>
          {/* Entrada 1 */}
          <View style={[styles.tableHeaderCell, { width: '15%' }]}> {/* Ajustado para 15% */}
            <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Entrada</Text>
            <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
          </View>
          {/* Assinatura 1 */}
          <View style={[styles.tableHeaderCell, { width: '20%' }]}> {/* Ajustado para 20% */}
            <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>ASSINATURA/JUSTIFICATIVA</Text>
          </View>
          {/* Saída 1 */}
          <View style={[styles.tableHeaderCell, { width: '15%' }]}> {/* Ajustado para 15% */}
            <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Saída</Text>
            <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
          </View>
          {/* Assinatura 2 */}
          <View style={[styles.tableHeaderCell, { width: '20%' }]}> {/* Ajustado para 20% */}
            <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>ASSINATURA/JUSTIFICATIVA</Text>
          </View>
          {/* Hora Extra - Nested View to simulate column and row span */}
          <View style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 0, flexDirection: 'column', padding: 0, borderBottomWidth: 0 }]}>
            <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 0, minHeight: 15, width: '100%', borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid' }}>
              <Text style={{ fontSize: 9, fontFamily: 'Calibri' }}>Hora Extra</Text>
            </View>
            <View style={{ flexDirection: 'row', width: '100%', flexGrow: 1 }}>
              <View style={[styles.tableHeaderCell, { width: '50%', borderBottomWidth: 0, borderTopWidth: 0 }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Calibri' }}>Entrada</Text>
                <Text style={{ fontFamily: 'Times-Roman', fontSize: 4 }}>(Horas | Minutos | Segundos)</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '50%', borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 0 }]}>
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

          const isLastRow = index === daysInMonth - 1;

          // Lógica para exibir o traço ou o nome do dia apenas se NÃO for um dia de trabalho configurado
          const displayTimeValue = (time: string | null) => formatFullTime(time || (!isWorkDayConfigured ? '-' : ''));
          const displaySignatureValue = !isWorkDayConfigured ? dayNamePtBr.toUpperCase() : '';

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.colDia, isLastRow && { borderBottomWidth: 1.5 }]}>{day}</Text>
              <Text style={[styles.colTime, isLastRow && { borderBottomWidth: 1.5 }]}>{displayTimeValue(record?.entry_time_1)}</Text>
              <Text style={[styles.colSignature, isLastRow && { borderBottomWidth: 1.5 }]}>{displaySignatureValue}</Text>
              <Text style={[styles.colTime, isLastRow && { borderBottomWidth: 1.5 }]}>{displayTimeValue(record?.exit_time_1)}</Text>
              <Text style={[styles.colSignature, isLastRow && { borderBottomWidth: 1.5 }]}>{displaySignatureValue}</Text>
              {/* Hora Extra Entrada */}
              <Text style={[styles.colExtraTime, isLastRow && { borderBottomWidth: 1.5 }]}>{formatFullTime(record?.entry_time_2)}</Text>
              {/* Hora Extra Saída */}
              <Text style={[styles.colExtraTime, { borderRightWidth: 0 }, isLastRow && { borderBottomWidth: 1.5 }]}>{formatFullTime(record?.exit_time_2)}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '33.33%', borderBottomWidth: 1.5 }]}>
            <Text style={{ flexGrow: 0 }}>Dias trabalhados:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%', borderBottomWidth: 1.5 }]}>
            <Text style={{ flexGrow: 0 }}>Total de Faltas:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
          <View style={[styles.cellBase, { width: '33.33%', borderRightWidth: 0, borderBottomWidth: 1.5 }]}>
            <Text style={{ flexGrow: 0 }}>Quantidade de horas-extras:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', padding: 3, borderRightWidth: 0, borderBottomWidth: 1.5 }]}>
            <Text style={[styles.sectionTitle, { flexGrow: 0 }]}>Observação:</Text>
            <Text style={{ minHeight: 15, flexGrow: 0 }}></Text>
          </View>
        </View>

        {/* Seção de Justificativa/Horas Extras */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, { width: '100%', padding: 3, borderRightWidth: 0, borderBottomWidth: 0 }]}>
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
  );
};

export default TimesheetPdfDocument;