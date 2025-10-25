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
    paddingTop: 28.35,    // 1 cm
    paddingRight: 36.00,  // 1.27 cm
    paddingBottom: 21.26, // 0.75 cm
    paddingLeft: 36.00,   // 1.27 cm
    fontSize: 8, // Tamanho da fonte base para o conteúdo
    fontFamily: 'Calibri', // Usar Calibri
  },
  headerContainer: {
    flexDirection: 'column', // Alterado para coluna para centralizar o bloco
    alignItems: 'center', // Centraliza o logo e o bloco de texto horizontalmente
    marginBottom: 5,
    width: '100%',
  },
  headerTextContent: {
    width: '100%', // Adicionado para garantir que o bloco de texto ocupe a largura total
    textAlign: 'center', // Corrigido para centralizar o texto dentro do bloco
    marginTop: 5, // Espaçamento entre logo e texto
  },
  headerText: {
    fontSize: 7, // Alterado para tamanho 7
    fontWeight: 'bold',
    marginBottom: 1,
    fontFamily: 'Calibri-Bold', // Alterado para Calibri-Bold
  },
  headerTitle: {
    fontSize: 10,
    marginBottom: 3,
  },
  // Estilo base para a ÚNICA tabela que engloba tudo
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
  // Estilos para as células de detalhes do funcionário (e agora para resumo/observação)
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
    fontFamily: 'Calibri', // Usar Calibri
  },
  // Estilos para as células do cabeçalho da folha de ponto
  tableHeaderCell: {
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 8, // Base font size, will be overridden by Text component
    minHeight: 15,
    fontFamily: 'Calibri', // Base font family, will be overridden by Text component
  },

  // Specific widths for each column in the main timesheet table
  colDia: { width: '5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '10%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 8, fontFamily: 'Calibri' }, // Reduzido para 10%
  colSignature: { width: '27.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 9, fontFamily: 'Calibri' }, // Aumentado para 27.5%
  colSignatureLast: { width: '27.5%', padding: 1, textAlign: 'center', borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#000000', borderStyle: 'solid', fontSize: 9, fontFamily: 'Calibri' }, // Aumentado para 27.5%
  
  // Estilos para as células de resumo (agora dentro da tabela principal)
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
    width: 24, // Largura: 0.85 cm ≈ 24 pt
    height: 33, // Altura: 1.16 cm ≈ 33 pt
  },
  boldText: {
    fontFamily: 'Calibri-Bold', // Estilo para texto em negrito
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
  employee_type: string; // Novo: "Cargo"
  function: string; // Existente: "Função"
  registration_number: string;
  school_name: string | null; // Alterado para permitir null
  work_days: string[];
  shift: string[] | null; // Alterado para array de strings
  vinculo: string; // Novo: "Tipo de Vínculo"
}

interface TimesheetPdfDocumentV2Props {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
  logoSrc: string | null;
}

const TimesheetPdfDocumentV2 = ({ employee, month, year, dailyRecords, logoSrc }: TimesheetPdfDocumentV2Props) => {
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

  const getRoleMark = (employeeType: string, role: "Gestor" | "Técnico" | "Professora") => {
    const lowerCaseEmployeeType = employeeType.toLowerCase();
    if (role === "Gestor" && lowerCaseEmployeeType.includes("gestor(a)")) return 'X';
    if (role === "Professora" && lowerCaseEmployeeType.includes("professor")) return 'X';
    if (role === "Técnico" && (lowerCaseEmployeeType.includes("assistente social") || lowerCaseEmployeeType.includes("psicólogo(a)"))) return 'X';
    return ' ';
  };

  // Função para formatar o tempo completo (HH:MM:SS)
  const formatFullTime = (timeString: string | null): string => {
    if (timeString === null || timeString === '') return ''; // Retorna string vazia para null ou vazio
    if (timeString === '-') return '-';
    const [h, m] = timeString.split(':');
    if (h === undefined || m === undefined) return ''; // Se a análise falhar, retorna string vazia
    return `${h}:${m}:00`;
  };

  return (
    <Document>
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

        {/* Única Tabela Principal que engloba Detalhes do Funcionário, Registros Diários e Resumo */}
        <View style={styles.mainTableContainer}>
          {/* Detalhes do Funcionário */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, paddingLeft: 10 }]}>
              <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '60%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Servidor (a): {employee.name}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '40%', borderRightWidth: 0 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>
                Gestor ({getRoleMark(employee.employee_type, "Gestor")}) Técnico ({getRoleMark(employee.employee_type, "Técnico")}) Professora ({getRoleMark(employee.employee_type, "Professora")})
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '33.33%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Cargo: {employee.employee_type}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Função: {employee.function}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '33.33%', borderRightWidth: 0 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Turno: ({getShiftMark(employee.shift, "Manhã")}) Manhã ({getShiftMark(employee.shift, "Tarde")}) Tarde ({getShiftMark(employee.shift, "Noite")}) Noite</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '25%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Vínculo: {employee.vinculo}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '25%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Matrícula: {employee.registration_number}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '25%' }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Mês: {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
            </View>
            <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 0 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Ano: {year}</Text>
            </View>
          </View>

          {/* Cabeçalho da Tabela de Registros Diários (FIXED) */}
          <View style={styles.tableRow} fixed>
            <View style={[styles.tableHeaderCell, styles.colDia]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Dia</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTime]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Entrada</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTime]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Saída</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colSignature]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>ASSINATURA/JUSTIFICATIVA</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTime]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Entrada</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colTime]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Saída</Text>
            </View>
            <View style={[styles.tableHeaderCell, styles.colSignatureLast, { borderRightWidth: 0 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>ASSINATURA/JUSTIFICATIVA</Text>
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
            const isLastDailyRecordRow = index === daysInMonth - 1;

            const getNotesForDay = (recordNotes: string | null): string => {
              if (recordNotes) {
                return recordNotes.toUpperCase();
              }
              return '';
            };

            const displayNotes = getNotesForDay(record?.notes);
            const displayTime = (time: string | null) => (isWeekend || !isWorkDayConfigured) ? '-' : formatFullTime(time);

            return (
              <View style={styles.tableRow} key={day}>
                <Text style={[styles.colDia, { fontFamily: 'Arial', fontSize: 8 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{day}</Text>
                <Text style={[styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{displayTime(record?.entry_time_1)}</Text>
                <Text style={[styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{displayTime(record?.exit_time_1)}</Text>
                <Text style={[styles.colSignature, isLastDailyRecordRow && { borderBottomWidth: 1.5 }, (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.boldText]}>{displayNotes}</Text>
                <Text style={[styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{displayTime(record?.entry_time_2)}</Text>
                <Text style={[styles.colTime, isLastDailyRecordRow && { borderBottomWidth: 1.5 }]}>{displayTime(record?.exit_time_2)}</Text>
                <Text style={[styles.colSignatureLast, { borderRightWidth: 0 }, isLastDailyRecordRow && { borderBottomWidth: 1.5 }, (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.boldText]}>{displayNotes}</Text>
              </View>
            );
          })}

          {/* Linha de Resumo: Dias Trabalhados */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, minHeight: 20 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 9 }}>Dias Trabalhados:</Text>
            </View>
          </View>

          {/* Seção de Observação */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, minHeight: 20 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 9 }}>Obs:</Text>
            </View>
          </View>
          {/* Linhas vazias para Obs - 3 linhas como na imagem */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, minHeight: 20 }]}>
              <Text></Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, minHeight: 20 }]}>
              <Text></Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, minHeight: 20 }]}>
              <Text></Text>
            </View>
          </View>

          {/* Seção de Horas Extras (agora a última linha da tabela) */}
          <View style={styles.tableRow}>
            <View style={[styles.infoCellBase, { width: '100%', borderRightWidth: 0, borderBottomWidth: 0, minHeight: 20 }]}>
              <Text style={{ fontFamily: 'Arial', fontSize: 8 }}>Horas Extras:</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={{ fontFamily: 'Arial', fontSize: 9, width: '40%', textAlign: 'center' }}>Campina Grande; ____/____/____</Text>
          <View style={{ width: '40%', textAlign: 'center' }}>
            <Text style={{ width: '100%', textAlign: 'center', fontSize: 9, fontFamily: 'Arial' }}>_________________________________________</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Arial' }}>Assinatura do(a) Gestor(a)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TimesheetPdfDocumentV2;