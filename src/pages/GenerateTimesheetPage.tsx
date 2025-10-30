"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TimesheetDisplay from "@/components/TimesheetDisplay";
import { getDaysInMonth, format, parseISO, isValid, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, FileDown, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TimesheetPdfPreview from "@/components/TimesheetPdfPreview"; // Modelo existente V1
import TimesheetPdfPreviewV2 from "@/components/TimesheetPdfPreviewV2"; // Modelo existente V2
import TimesheetPdfPreviewV3 from "@/components/TimesheetPdfPreviewV3"; // Novo modelo V3
import TimesheetPdfPreviewV4 from "@/components/TimesheetPdfPreviewV4"; // Novo modelo V4
import TimesheetPdfPreviewV5 from "@/components/TimesheetPdfPreviewV5"; // Novo modelo V5
import TimesheetPdfPreviewV6 from "@/components/TimesheetPdfPreviewV6"; // Importar o novo V6
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { normalizeString } from "@/lib/utils"; // Importar a nova função
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importar Tabs
import BatchTimesheetGenerator from "@/components/BatchTimesheetGenerator"; // Importar o novo componente

interface Employee {
  id: string;
  name: string;
  employee_type: string; // Novo: "Cargo"
  function: string; // Existente: "Função"
  registration_number: string;
  school_name: string | null; // Alterado para permitir null
  work_days: string[];
  shift: string[] | null; // Alterado para array de strings
  vinculo: string; // Novo: "Tipo de Vínculo"
  discipline: string | null; // Novo campo
  weekly_hours: number | null; // Novo campo
}

interface DailyRecord {
  id: string;
  record_date: string;
  entry_time_1: string | null;
  exit_time_1: string | null;
  entry_time_2: string | null;
  exit_time_2: string | null;
  total_hours_worked: number | null;
  notes: string | null;
}

const GenerateTimesheetPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [generatedTimesheet, setGeneratedTimesheet] = useState<{
    employee: Employee;
    month: number;
    year: number;
    dailyRecords: DailyRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false); // Estado para controlar a abertura do combobox

  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const daysOfWeekMapForDisplay: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
  };

  const fetchEmployees = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para gerar folhas de ponto.");
      return;
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar funcionários: " + error.message);
      console.error("Erro ao carregar funcionários:", error);
    } else {
      // Filtrar funcionários com IDs nulos ou indefinidos
      const validEmployees = (data || []).filter(emp => emp.id != null) as Employee[];
      setEmployees(validEmployees);
      if (validEmployees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(validEmployees[0].id);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Carregar o logo como base64
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setLogoBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          console.warn("Logo image not found or failed to load:", response.statusText);
        }
      } catch (error) {
        console.error("Error loading logo image for PDF:", error);
      }
    };
    fetchLogo();
  }, []);

  const calculateHours = (entry1: string | null, exit1: string | null, entry2: string | null, exit2: string | null): number => {
    let totalMinutes = 0;

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    if (entry1 && exit1) {
      const start1 = parseTime(entry1);
      const end1 = parseTime(exit1);
      if (end1 > start1) totalMinutes += (end1 - start1);
    }
    if (entry2 && exit2) {
      const start2 = parseTime(entry2);
      const end2 = parseTime(exit2);
      if (end2 > start2) totalMinutes += (end2 - start2);
    }

    return totalMinutes / 60;
  };

  const generateTimesheet = async () => {
    if (!selectedEmployeeId || !selectedDate) {
      toast.error("Por favor, selecione um funcionário e um mês/ano.");
      return;
    }

    setLoading(true);
    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee || !employee.id) { // Adicionada verificação para employee.id
      toast.error("Funcionário não encontrado ou ID inválido.");
      setLoading(false);
      return;
    }

    const month = selectedDate.getMonth() + 1; // getMonth() is 0-indexed
    const year = selectedDate.getFullYear();
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const dailyRecords: DailyRecord[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para gerar folhas de ponto.");
      setLoading(false);
      return;
    }

    try {
      let { data: existingTimesheet, error: fetchError } = await supabase
        .from("timesheets")
        .select("id")
        .eq("employee_id", employee.id)
        .eq("month", month)
        .eq("year", year)
        .single();

      let timesheetId: string;

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw fetchError;
      }

      if (existingTimesheet) {
        timesheetId = existingTimesheet.id;
        toast.info("Folha de ponto para este mês já existe. Gerando novamente.");
        await supabase.from("daily_records").delete().eq("timesheet_id", timesheetId);
      } else {
        const { data: newTimesheet, error: insertTimesheetError } = await supabase
          .from("timesheets")
          .insert({
            user_id: user.id,
            employee_id: employee.id,
            month,
            year,
            status: "generated",
          })
          .select("id")
          .single();

        if (insertTimesheetError) throw insertTimesheetError;
        timesheetId = newTimesheet.id;
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month - 1, i);
        const dayName = daysOfWeekMapForComparison[getDay(currentDate)]; // e.g., 'Sunday'
        const dayNamePtBr = daysOfWeekMapForDisplay[getDay(currentDate)]; // e.g., 'Domingo'
        
        let entry_time_1: string | null = null;
        let exit_time_1: string | null = null;
        let entry_time_2: string | null = null;
        let exit_time_2: string | null = null;
        let notes: string | null = null;

        const isWorkDay = employee.work_days.includes(dayName);
        const isCurrentDateWeekend = (getDay(currentDate) === 0 || getDay(currentDate) === 6);

        const normalizedEmployeeFunction = normalizeString(employee.function);
        
        const isVigia12x36Contrato = employee.employee_type === "Vigia" && employee.vinculo === "Contrato" && normalizedEmployeeFunction.includes("vigia") && normalizedEmployeeFunction.includes("12h x 36h");
        const isGenericVigiaContratoOrASGContrato = (employee.employee_type === "Vigia" && employee.vinculo === "Contrato" && normalizedEmployeeFunction.includes("vigia") && !normalizedEmployeeFunction.includes("12h x 36h")) || 
                                                     (normalizedEmployeeFunction.includes("asg") && employee.vinculo === "Contrato");

        // Lógica de notas específica para V6 (Educador Voluntário 20H)
        if (employee.vinculo === "Educador Voluntário 20H") {
          entry_time_1 = null; // Vazio para preenchimento manual
          exit_time_1 = null; // Vazio para preenchimento manual
          entry_time_2 = null; // Vazio para preenchimento manual (não usado no PDF, mas para consistência)
          exit_time_2 = null; // Vazio para preenchimento manual (não usado no PDF, mas para consistência)

          if (isCurrentDateWeekend) {
            notes = dayNamePtBr.toUpperCase(); // SÁBADO ou DOMINGO
          } else if (month === 10 && day === 11) { // Exemplo para Outubro, dia 11
            notes = "FERIADO DIA DA CIDADE";
          } else {
            notes = null; // Dias de semana normais ficam em branco
          }
        }
        // Lógica de notas específica para V5 (Professor Fundamental II com Prestador(a) de Serviços OU Contrato)
        else if (employee.employee_type === "Professor Fundamental II" && (employee.vinculo === "Prestador(a) de Serviços" || employee.vinculo === "Contrato")) {
          if (isCurrentDateWeekend) {
            notes = dayNamePtBr.toUpperCase();
          } else if (!isWorkDay) {
            notes = null;
          }
        }
        // Lógica de notas específica para V4 (Educador Voluntário)
        else if (employee.vinculo === "Educador Voluntário") {
          if (!isWorkDay) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr.toUpperCase();
            } else {
              notes = "------------------------------";
            }
          }
          if (i === 7 && !isWorkDay) {
            notes = "FERIADO";
          }
        }
        // Lógica de notas para V3 (Vigia 12x36 Contrato) - Deixar em branco
        else if (isVigia12x36Contrato) {
          if (!isWorkDay) {
            notes = null; // Deixar em branco conforme solicitado
          }
          if (i === 7 && !isWorkDay) { // Exemplo de FERIADO para o dia 7
            notes = "FERIADO";
          }
        }
        // Lógica de notas para V3 (ASG e Contrato) ou Vigia (Contrato, genérico)
        else if (isGenericVigiaContratoOrASGContrato) {
          if (!isWorkDay) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr.toUpperCase(); // "SÁBADO" or "DOMINGO"
            } else {
              notes = "-------------------------"; // Para dias de semana não trabalhados
            }
          }
          if (i === 7 && !isWorkDay) { // Exemplo de FERIADO para o dia 7
            notes = "FERIADO";
          }
        }
        // Lógica de notas para V1 e V2 (padrão)
        else {
          if (!isWorkDay) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr;
            } else {
              notes = "SÁBADO E DOMINGO";
            }
          }
        }

        // Os campos de horário são inicializados como null e não são preenchidos automaticamente
        // para permitir o preenchimento manual.
        const total_hours_worked = calculateHours(entry_time_1, exit_time_1, entry_time_2, exit_time_2);

        dailyRecords.push({
          id: `temp-${i}`,
          record_date: format(currentDate, "yyyy-MM-dd"),
          entry_time_1,
          exit_time_1,
          entry_time_2,
          exit_time_2,
          total_hours_worked,
          notes,
        });
      }

      const recordsToInsert = dailyRecords.map(record => ({
        timesheet_id: timesheetId,
        record_date: record.record_date,
        entry_time_1: record.entry_time_1,
        exit_time_1: record.entry_time_1, // Usar entry_time_1 para exit_time_1 para V6 (ambos vazios)
        entry_time_2: record.entry_time_2,
        exit_time_2: record.exit_time_2,
        total_hours_worked: record.total_hours_worked,
        notes: record.notes,
      }));

      const { error: insertRecordsError } = await supabase
        .from("daily_records")
        .insert(recordsToInsert);

      if (insertRecordsError) throw insertRecordsError;

      const { data: fetchedDailyRecords, error: fetchRecordsError } = await supabase
        .from("daily_records")
        .select("*")
        .eq("timesheet_id", timesheetId)
        .order("record_date", { ascending: true });

      if (fetchRecordsError) throw fetchRecordsError;

      setGeneratedTimesheet({
        employee,
        month,
        year,
        dailyRecords: fetchedDailyRecords as DailyRecord[],
      });
      toast.success("Folha de ponto gerada e salva com sucesso!");

    } catch (error: any) {
      console.error("Erro ao gerar folha de ponto:", error);
      toast.error(error.message || "Erro ao gerar folha de ponto.");
      setGeneratedTimesheet(null);
    } finally {
      setLoading(false);
    }
  };

  const currentEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

  // Determine which PDF preview component to use based on employee_type and vinculo
  let PdfPreviewComponent;
  const normalizedCurrentFunction = normalizeString(currentEmployee?.function);
  const currentEmployeeType = currentEmployee?.employee_type;
  const currentEmployeeVinculo = currentEmployee?.vinculo;

  if (currentEmployeeVinculo === "Educador Voluntário 20H") { // Nova condição para V6
    PdfPreviewComponent = TimesheetPdfPreviewV6;
  } else if (currentEmployeeType === "Professor Fundamental II" && (currentEmployeeVinculo === "Prestador(a) de Serviços" || currentEmployeeVinculo === "Contrato")) { // Prioriza Professor Fundamental II para V5
    PdfPreviewComponent = TimesheetPdfPreviewV5;
  } else if (currentEmployeeVinculo === "Educador Voluntário") { // V4 agora lida com Educador Voluntário (não 20H)
    PdfPreviewComponent = TimesheetPdfPreviewV4;
  } else if (currentEmployeeType === "Vigia" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("vigia")) {
    PdfPreviewComponent = TimesheetPdfPreviewV3;
  } else if (normalizedCurrentFunction.includes("asg") && currentEmployeeVinculo === "Contrato") {
    PdfPreviewComponent = TimesheetPdfPreviewV3;
  } else if (currentEmployeeType === "Professor" && currentEmployeeVinculo === "Contrato") {
    PdfPreviewComponent = TimesheetPdfPreviewV2;
  } else {
    // Adicionado "Supervisor(a)" à lista de cargos que usam V2
    const isV2Role = ["Professor", "Assistente Social", "Psicólogo(a)", "Gestor(a)", "Supervisor(a)"].includes(currentEmployeeType || "");
    const isEfetivo = currentEmployeeVinculo === "Efetivo";
    PdfPreviewComponent = (isV2Role && isEfetivo) ? TimesheetPdfPreviewV2 : TimesheetPdfPreview;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerar Folha de Ponto</h1>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Geração Individual</TabsTrigger>
          <TabsTrigger value="batch">Geração em Lote</TabsTrigger>
        </TabsList>
        <TabsContent value="individual">
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>Configurações da Folha de Ponto Individual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employee-select">Selecionar Funcionário</Label>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="w-full justify-between"
                    >
                      {selectedEmployeeId && currentEmployee
                        ? `${currentEmployee.name} (${currentEmployee.registration_number}) - ${currentEmployee.school_name || 'N/A'}`
                        : "Selecione um funcionário..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar funcionário..." />
                      <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                      <CommandGroup>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${normalizeString(employee.name)} ${normalizeString(employee.registration_number)} ${normalizeString(employee.function)} ${normalizeString(employee.school_name)}`}
                            onSelect={(currentValue) => {
                              const selected = employees.find(emp => 
                                `${normalizeString(emp.name)} ${normalizeString(emp.registration_number)} ${normalizeString(emp.function)} ${normalizeString(emp.school_name)}` === currentValue
                              );
                              setSelectedEmployeeId(selected?.id === selectedEmployeeId ? null : selected?.id);
                              setIsComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.name} ({employee.registration_number || 'N/A'}) - {employee.function} - {employee.school_name || 'N/A'}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="month-year-picker">Mês e Ano</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "MMMM yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione um mês</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={2020}
                      toYear={2050}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex space-x-2">
                <Button onClick={generateTimesheet} disabled={loading || !selectedEmployeeId || !selectedDate} className="flex-1">
                  {loading ? (
                    <>
                      <FileText className="mr-2 h-4 w-4 animate-pulse" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar Folha de Ponto
                    </>
                  )}
                </Button>
                <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!generatedTimesheet}
                      onClick={() => setIsPdfPreviewOpen(true)}
                    >
                      <FileDown className="mr-2 h-4 w-4" /> Visualizar PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-5xl h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-0">
                      <DialogTitle>Pré-visualização da Folha de Ponto</DialogTitle>
                    </DialogHeader>
                    {generatedTimesheet && (
                      <PdfPreviewComponent
                        employee={generatedTimesheet.employee}
                        month={generatedTimesheet.month}
                        year={generatedTimesheet.year}
                        dailyRecords={generatedTimesheet.dailyRecords}
                        logoSrc={logoBase64}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {generatedTimesheet && (
            <TimesheetDisplay
              employee={generatedTimesheet.employee}
              month={generatedTimesheet.month}
              year={generatedTimesheet.year}
              dailyRecords={generatedTimesheet.dailyRecords}
            />
          )}
        </TabsContent>
        <TabsContent value="batch">
          <BatchTimesheetGenerator employees={employees} logoBase64={logoBase64} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerateTimesheetPage;