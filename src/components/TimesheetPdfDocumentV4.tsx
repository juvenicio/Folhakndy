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
    paddingBottom: 36.00, // 1.27 cm - Ajustado para corresponder à V6
    paddingLeft: 36.00,   // 1.27 cm
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  headerImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  headerImage: {
    width: '100%',
    height: 20,
    objectFit: 'contain',
  },
  mainTableContainer: {
    display: 'table',
    width: 'auto',
    marginBottom: 0,
    borderWidth: 1.5, // Borda externa da tabela principal
    borderColor: '#000000',
    borderStyle: 'solid',
    flexGrow: 1,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },

  // Estilo base para todas as células internas
  cellBase: {
    borderRightWidth: 1.5, // Alterado para borderRightWidth
    borderBottomWidth: 1.5, // Alterado para borderBottomWidth
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    fontSize: 8,
    fontFamily: 'Calibri',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos específicos para tipos de células
  headerCell: {
    minHeight: 15, // Altura mínima para o cabeçalho
    fontFamily: 'Calibri-Bold',
    fontSize: 10,
  },
  infoCell: {
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 9,
    fontFamily: 'Calibri-Bold',
  },
  dailyRecordCell: {
    fontSize: 8,
    fontFamily: 'Calibri',
    minHeight: 15, // Altura mínima para as células de registro diário
  },
  centeredChargeHoursCell: {
    width: '100%',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    fontSize: 10,
    fontFamily: 'Calibri-Bold',
  },
  
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
    width: '100%',
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
  arialBold8: {
    fontFamily: 'Arial',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

interface TimesheetPdfDocumentV4Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfDocumentV4 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentV4Props) => {
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
  const isSetembro = monthNameFormatted === "Setembro";

  return (
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho com a imagem */}
      <View style={styles.headerImageContainer}>
        <Image src="/header_educadores_voluntarios.png" style={styles.headerImage} />
      </View>

      {/* Tabela Principal */}
      <View style={styles.mainTableContainer}>
        {/* Detalhes do Funcionário */}
        {/* Row 1: Unidade de Trabalho */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.infoCell, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0 }]}>
            <Text>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        {/* Row 2: NOME */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.infoCell, { width: '100%', borderLeftWidth: 0, borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text>NOME: {employee.name}</Text>
          </View>
        </View>
        {/* Nova linha para CARGA HORÁRIA */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.centeredChargeHoursCell, { width: '100%', borderLeftWidth: 0, borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text>CARGA HORÁRIA: 40 HORAS</Text>
          </View>
        </View>
        {/* Linha para Turno, Mês e Ano */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.infoCell, { width: '50%', borderLeftWidth: 0 }]}>
            <Text>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.cellBase, styles.infoCell, { width: '25%' }]}>
            <Text>
              Mês:{" "}
              <Text style={isSetembro ? { fontFamily: 'Times-Roman', fontSize: 7 } : { fontFamily: 'Calibri-Bold', fontSize: 10 }}>
                {monthNameFormatted}
              </Text>
            </Text>
          </View>
          <View style={[styles.cellBase, styles.infoCell, { width: '25%', borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.cellBase, styles.headerCell, { width: '5%', borderLeftWidth: 0 }]}>
            <Text>Dia</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '10%' }]}>
            <Text>Entrada</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '10%' }]}>
            <Text>Saída</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '30%' }]}>
            <Text>ASSINATURA</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '10%' }]}>
            <Text>Entrada</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '10%' }]}>
            <Text>Saída</Text>
          </View>
          <View style={[styles.cellBase, styles.headerCell, { width: '25%', borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
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
          const isWorkDayConfigured = employee.work_days.includes(dayNameEnglish);

          const displayTime = (time: string | null) => {
            if (isWorkDayConfigured) {
              return formatTimeForDisplay(time);
            }
            return time ? formatTimeForDisplay(time) : '-';
          };

          const displayNotes = (record?.notes || '').toUpperCase();

          return (
            <View style={styles.tableRow} key={day}>
              <View style={[styles.cellBase, styles.dailyRecordCell, { width: '5%', borderLeftWidth: 0 }]}>
                <Text>{day}</Text>
              </View>
              <View style={[styles.cellBase, styles.dailyRecordCell, { width: '10%' }]}>
                <Text>{displayTime(record?.entry_time_1)}</Text>
              </View>
              <View style={[styles.cellBase, styles.dailyRecordCell, { width: '10%' }]}>
                <Text>{displayTime(record?.exit_time_1)}</Text>
              </View>
              <View style={[
                styles.cellBase, styles.dailyRecordCell, { width: '30%' },
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.arialBold8
              ]}>
                <Text>{displayNotes}</Text>
              </View>
              <View style={[styles.cellBase, styles.dailyRecordCell, { width: '10%' }]}>
                <Text>{displayTime(record?.entry_time_2)}</Text>
              </View>
              <View style={[styles.cellBase, styles.dailyRecordCell, { width: '10%' }]}>
                <Text>{displayTime(record?.exit_time_2)}</Text>
              </View>
              <View style={[
                styles.cellBase, styles.dailyRecordCell, { width: '25%', borderRightWidth: 0 }, // Removido borderRightWidth aqui
                (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.arialBold8
              ]}>
                <Text>{displayNotes}</Text>
              </View>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.infoCell, { width: '50%', borderLeftWidth: 0 }]}>
            <Text>Dias Trabalhados:</Text>
          </View>
          <View style={[styles.cellBase, styles.infoCell, { width: '50%', borderRightWidth: 0 }]}> {/* Removido borderRightWidth aqui */}
            <Text>Total de Faltas:</Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.cellBase, styles.infoCell, { width: '5%', padding: 3, justifyContent: 'center', borderLeftWidth: 0 }]}>
            <Text>Obs:</Text>
          </View>
          <View style={[styles.cellBase, styles.infoCell, { width: '95%', padding: 3, flexDirection: 'column', justifyContent: 'flex-end', flexGrow: 1, minHeight: 90, borderBottomWidth: 0, borderRightWidth: 0 }]}> {/* Removido borderRightWidth e borderBottomWidth aqui */}
            {/* Conteúdo da área, atualmente vazio conforme a imagem */}
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

export default TimesheetPdfDocumentV4;