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
    borderWidth: 1.5, // Borda externa da tabela principal
    borderColor: '#000000',
    borderStyle: 'solid',
    flexGrow: 1, // Adicionado para ocupar o espaço restante
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
    alignItems: 'stretch', // Alterado para stretch
    fontSize: 8,
    fontFamily: 'Calibri', // Usar Calibri
    minHeight: 15, // Adicionado minHeight
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
    alignItems: 'stretch', // Alterado para stretch
    fontSize: 8, // Base font size, will be overridden by Text component
    minHeight: 15,
    fontFamily: 'Calibri', // Base font family, will be overridden by Text component
  },

  // Specific widths for each column in the main timesheet table
  colDia: { width: '5%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' },
  colTime: { width: '10%', padding: 1, textAlign: 'center', fontSize: 8, fontFamily: 'Calibri' }, // Reduzido para 10%
  colSignature: { width: '27.5%', padding: 1, textAlign: 'center', fontSize: 9, fontFamily: 'Calibri' }, // Aumentado para 27.5%
  colSignatureLast: { width: '27.5%', padding: 1, textAlign: 'center', fontSize: 9, fontFamily: 'Calibri' }, // Aumentado para 27.5%
  
  // Estilos para as células de resumo (agora dentro da tabela principal)
  sectionTitle: {
    fontSize: 9,
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

  // Modificado para incluir employeeFunction
  const getRoleMark = (employeeType: string, employeeFunction: string | null, role: "Gestor" | "Técnico" | "Professora") => {
    const lowerCaseEmployeeType = employeeType.toLowerCase();
    const lowerCaseEmployeeFunction = (employeeFunction || '').toLowerCase();

    // Corrigido: procurar por "gestor" sem os parênteses
    if (role === "Gestor" && lowerCaseEmployeeFunction.includes("gestor")) return 'X';
    if (role === "Professora" && lowerCaseEmployeeType.includes("professor") && !lowerCaseEmployeeFunction.includes("gestor")) return 'X'; // Professor, mas não gestor
    if (role === "Técnico" && (lowerCaseEmployeeType.includes("assistente social") || lowerCaseEmployeeType.includes("psicólogo(a)") || lowerCaseEmployeeType.includes("supervisor(a)"))) return 'X';
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
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderTopWidth: 0, borderRightWidth: 0, paddingLeft: 10 }]}>
            <Text style={{ fontFamily: 'Calibri', fontSize: 10 }}>Unidade de Trabalho: {employee.school_name || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '60%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Servidor (a): {employee.name}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '40%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>
              Gestor(a) ({getRoleMark(employee.employee_type, employee.function, "Gestor")}) Técnico ({getRoleMark(employee.employee_type, employee.function, "Técnico")}) Professor(a) ({getRoleMark(employee.employee_type, employee.function, "Professora")})
            </Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '33.33%', borderLeftWidth: 0 }]}>
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
          <View style={[styles.infoCellBase, { width: '25%', borderLeftWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Vínculo: {employee.vinculo}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Matrícula: {employee.registration_number}</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '25%' }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Mês: {monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
          </Text>
          <View style={[styles.infoCellBase, { width: '25%', borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Ano: {year}</Text>
          </View>
        </View>

        {/* Cabeçalho da Tabela de Registros Diários (FIXED) */}
        <View style={styles.tableRow} fixed>
          <View style={[styles.tableHeaderCell, styles.colDia, { borderLeftWidth: 0, borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Dia</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignature, { borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>ASSINATURA/JUSTIFICATIVA</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Entrada</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colTime, { borderTopWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 10 }}>Saída</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSignatureLast, { borderRightWidth: 0, borderTopWidth: 0 }]}>
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

          const isLastDailyRecordRow = index === daysInMonth - 1;

          // Lógica para exibir o traço ou o nome do dia apenas se NÃO for um dia de trabalho configurado
          const getNotesForDay = (recordNotes: string | null): string => {
            if (isWorkDayConfigured) { // Se for um dia de trabalho configurado, não mostra notas de fim de semana
              return recordNotes || '';
            }
            // Se não for um dia de trabalho configurado, mostra as notas geradas (Sábado/Domingo/SÁBADO E DOMINGO)
            return (recordNotes || '').toUpperCase();
          };

          const displayNotes = getNotesForDay(record?.notes);
          const displayTime = (time: string | null) => (!isWorkDayConfigured && (dayOfWeek === 0 || dayOfWeek === 6)) ? '-' : formatFullTime(time);


          return (
            <View style={styles.tableRow} key={day}>
              <Text style={[styles.infoCellBase, styles.colDia, { borderLeftWidth: 0 }]}>{day}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTime(record?.entry_time_1)}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTime(record?.exit_time_1)}</Text>
              <Text style={[styles.infoCellBase, styles.colSignature, (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.boldText]}>{displayNotes}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTime(record?.entry_time_2)}</Text>
              <Text style={[styles.infoCellBase, styles.colTime]}>{displayTime(record?.exit_time_2)}</Text>
              <Text style={[styles.infoCellBase, styles.colSignatureLast, (displayNotes.includes("SÁBADO") || displayNotes.includes("DOMINGO")) && styles.boldText, { borderRightWidth: 0 }]}>{displayNotes}</Text>
            </View>
          );
        })}

        {/* Linha de Resumo: Dias Trabalhados */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, minHeight: 20, borderRightWidth: 0 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 9 }}>Dias Trabalhados:</Text>
          </View>
        </View>

        {/* Seção de Observação */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '10%', borderLeftWidth: 0, minHeight: 20 }]}>
            <Text style={{ fontFamily: 'Arial', fontSize: 9 }}>Obs:</Text>
          </View>
          <View style={[styles.infoCellBase, { width: '90%', minHeight: 20, borderRightWidth: 0 }]}>
            <Text></Text>
          </View>
        </View>
        {/* Linhas vazias para Obs - 3 linhas como na imagem */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '10%', borderLeftWidth: 0, minHeight: 20 }]}>
            <Text></Text>
          </View>
          <View style={[styles.infoCellBase, { width: '90%', minHeight: 20, borderRightWidth: 0 }]}>
            <Text></Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '10%', borderLeftWidth: 0, minHeight: 20 }]}>
            <Text></Text>
          </View>
          <View style={[styles.infoCellBase, { width: '90%', minHeight: 20, borderRightWidth: 0 }]}>
            <Text></Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '10%', borderLeftWidth: 0, minHeight: 20, borderBottomWidth: 0 }]}>
            <Text></Text>
          </View>
          <View style={[styles.infoCellBase, { width: '90%', minHeight: 20, borderBottomWidth: 0, borderRightWidth: 0 }]}>
            <Text></Text>
          </View>
        </View>

        {/* Seção de Horas Extras (agora a última linha da tabela) */}
        <View style={styles.tableRow}>
          <View style={[styles.infoCellBase, { width: '100%', borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: 0 }]}>
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
  );
};

export default TimesheetPdfDocumentV2;