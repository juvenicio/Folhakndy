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
    fontSize: 8,
    fontFamily: 'Calibri',
  },
  headerImageContainer: { // Novo estilo para o container da imagem do cabeçalho
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
  },
  headerImage: { // Novo estilo para a imagem do cabeçalho
    width: '100%', // Ajustado para 100% da largura do container
    height: 20, // Ajuste a altura conforme necessário
    objectFit: 'contain',
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
  // Estilo base para todas as células dentro da tabela principal (info, resumo, observação)
  infoCellBase: {
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 2,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontSize: 8,
    fontFamily: 'Calibri',
    borderTopWidth: 1.5, // Internal top border
    borderLeftWidth: 1.5, // Internal left border
  },
  // Estilo para a célula de carga horária (100% de largura)
  centeredChargeHoursCell: {
    width: '100%',
    borderTopWidth: 1.5, // Internal top border
    borderLeftWidth: 1.5, // Internal left border
    borderColor: '#000000',
    borderStyle: 'solid',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  // Estilo para células de cabeçalho da tabela de registros diários
  tableHeaderCell: {
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8,
    minHeight: 15,
    fontFamily: 'Calibri',
    borderTopWidth: 1.5, // Internal top border
    borderLeftWidth: 1.5, // Internal left border
  },
  // Estilos específicos para as colunas da tabela de registros diários (5 colunas)
  colDia: { width: '5%', textAlign: 'center' },
  colTime: { width: '10%', textAlign: 'center' }, // Reduzido para 10% e centralizado
  colSignature: { width: '35%', textAlign: 'center' }, // Aumentado para 35% e centralizado
  colSignatureLast: { width: '40%', textAlign: 'center' }, // Aumentado para 40% e centralizado
  
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
  arialBold8: { // Novo estilo para Arial, negrito, tamanho 8
    fontFamily: 'Arial',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

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

  // Função para determinar o que exibir nas células de tempo
  const displayTimeValue = (notes: string | null) => {
    const upperCaseNotes = (notes || '').toUpperCase();
    if (upperCaseNotes.includes("SÁBADO") || upperCaseNotes.includes("DOMINGO")) {
      return '-'; // Exibe '-' para dias de fim de semana
    }
    return ''; // Vazio para preenchimento manual em dias de semana
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho com a imagem */}
      <View style={styles.headerImageContainer}>
        <Image src="/header_educadores_voluntarios.png" style={styles.headerImage} />
      </View>

      {/* Tabela Principal Unificada */}
      <View style={styles.mainTableContainer}>
        {/* Row 1: Unidade de Trabalho */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Unidade de Trabalho: {employee?.school_name || 'N/A'}</Text>
          </View>
        </View>
        {/* Row 2: NOME */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>NOME: {employee?.name || 'N/A'}</Text>
          </View>
        </View>
        {/* Row 3: CARGA HORÁRIA */}
        <View style={styles.tableRow}>
          <View style={[styles.centeredChargeHoursCell, { borderLeftWidth: 0, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>CARGA HORÁRIA: {employee?.weekly_hours ? `${employee.weekly_hours} HORAS` : 'N/A'}</Text>
          </View>
        </View>
        {/* Row 4: Turno, Mês e Ano */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Turno: ({getShiftMark(employee?.shift, "Manhã")}) Manhã ({getShiftMark(employee?.shift, "Tarde")}) Tarde ({getShiftMark(employee?.shift, "Noite")}) Noite</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Mês: {monthNameFormatted}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Ano: {year}</Text>
          </Text>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários (5 colunas) */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.tableHeaderCell, styles.colDia, { borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Dia</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignature]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>ASSINATURA</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignatureLast, { borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 10 }}>ASSINATURA</Text>
          </Text>
        </View>

        {/* Linhas de Registros Diários (5 colunas) */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, index) => {
          const record = dailyRecords.find(r => {
            const recordDate = isValid(parseISO(r.record_date)) ? parseISO(r.record_date) : null;
            return recordDate && recordDate.getDate() === day;
          });
          
          const displayNotes = (record?.notes || '').toUpperCase();

          const isWeekendNote = displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO");

          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.infoCellBase, styles.colDia, { borderLeftWidth: 0 }]}>{day}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTimeValue(record?.notes)}</Text>
              <Text style={[
                styles.infoCellBase, styles.colSignature,
                isWeekendNote ? styles.arialBold8 : styles.boldText, // Aplicar Arial, negrito, 8pt para SÁBADO/DOMINGO
                { textAlign: 'center' } // Centralizar o texto
              ]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTimeValue(record?.notes)}</Text>
              <Text style={[
                styles.infoCellBase, styles.colSignatureLast,
                isWeekendNote ? styles.arialBold8 : styles.boldText, // Aplicar Arial, negrito, 8pt para SÁBADO/DOMINGO
                { textAlign: 'center', borderRightWidth: 0 } // Centralizar o texto e removido borderRightWidth
              ]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '50%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Dias trabalhados:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '50%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Calibri-Bold', fontSize: 9 }}>Total de Faltas:</Text>
          </Text>
        </View>

        {/* Seção de Observação (Last row of the entire table) */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '5%', justifyContent: 'center', borderLeftWidth: 0, borderBottomWidth: 0 }]}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Calibri-Bold', fontSize: 9, marginBottom: 0 }]}>Obs:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '95%', borderBottomWidth: 0, borderRightWidth: 0 }]}>
            {/* Content area, currently empty as per image */}
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