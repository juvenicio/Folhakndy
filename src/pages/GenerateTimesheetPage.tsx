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
import { CalendarIcon, FileText, FileDown, Check, ChevronsUpDown, Search } from "lucide-react";
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
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { normalizeString } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BatchTimesheetGenerator from "@/components/BatchTimesheetGenerator";
import { DailyRecord, Employee } from "@/types";
import { useSession } from "@/components/SessionContextProvider";

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
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useSession();

  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const daysOfWeekMapForDisplay: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
  };

  const fetchEmployees = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para gerar folhas de ponto.");
      return;
    }

    let query = supabase
      .from("employees")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar funcionários: " + error.message);
      console.error("Erro ao carregar funcionários:", error);
    } else {
      setEmployees(data || []);
      if (data && data.length > 0 && !selectedEmployeeId) {
        // setSelectedEmployeeId(data[0].id); 
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user]);

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
    if (!employee) {
      toast.error("Funcionário não encontrado.");
      setLoading(false);
      return;
    }

    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const dailyRecords: DailyRecord[] = [];

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

      if (fetchError && fetchError.code !== 'PGRST116') {
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
        const dayName = daysOfWeekMapForComparison[getDay(currentDate)];
        const dayNamePtBr = daysOfWeekMapForDisplay[getDay(currentDate)];
        
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

        if (employee.vinculo === "Educador Voluntário 20H") {
          entry_time_1 = null;
          exit_time_1 = null;
          entry_time_2 = null;
          exit_time_2 = null;

          if (isCurrentDateWeekend) {
            notes = dayNamePtBr.toUpperCase();
          } else if (month === 10 && i === 11) { 
            notes = "FERIADO DIA DA CIDADE";
          } else {
            notes = null;
          }
        }
        else if (employee.employee_type === "Professor Fundamental II" && (employee.vinculo === "Prestador(a) de Serviços" || employee.vinculo === "Contrato")) {
          if (isCurrentDateWeekend) {
            notes = dayNamePtBr.toUpperCase();
          } else if (!isWorkDay) {
            notes = null;
          }
        }
        else if (employee.employee_type === "Professor Fundamental II" && employee.vinculo === "Efetivo") {
          if (isCurrentDateWeekend) {
            notes = dayNamePtBr.toUpperCase();
          } else if (!isWorkDay) {
            notes = null;
          }
        }
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
        else if (isVigia12x36Contrato) {
          if (!isWorkDay) {
            notes = null;
          }
          if (i === 7 && !isWorkDay) {
            notes = "FERIADO";
          }
        }
        else if (isGenericVigiaContratoOrASGContrato || (employee.employee_type === "Psicólogo(a)" && employee.vinculo === "Contrato" && normalizedEmployeeFunction.includes("psicologa")) || (employee.employee_type === "Nutricionista" && employee.vinculo === "Contrato") || (employee.employee_type === "Merendeira" && employee.vinculo === "Contrato" && normalizedEmployeeFunction.includes("merendeira")) || (employee.employee_type === "Supervisor(a)" && employee.vinculo === "Contrato" && normalizedEmployeeFunction.includes("supervisora"))) {
          if (!isWorkDay) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr.toUpperCase();
            } else {
              notes = "-------------------------";
            }
          }
          if (i === 7 && !isWorkDay) {
            notes = "FERIADO";
          }
        }
        else {
          if (!isWorkDay) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr;
            } else {
                notes = "SÁBADO E DOMINGO";
            }
          }
        }

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
        exit_time_1: record.exit_time_1,
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

  const filteredEmployees = employees.filter((employee) => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    return (
      normalizeString(employee.name).includes(normalizedSearchTerm) ||
      normalizeString(employee.registration_number).includes(normalizedSearchTerm) ||
      normalizeString(employee.function).includes(normalizedSearchTerm) ||
      normalizeString(employee.school_name).includes(normalizedSearchTerm) ||
      (employee.shift && employee.shift.some(s => normalizeString(s).includes(normalizedSearchTerm))) // Incluir busca por turno
    );
  });

  let PdfPreviewComponent;
  const normalizedCurrentFunction = normalizeString(currentEmployee?.function);
  const currentEmployeeType = currentEmployee?.employee_type;
  const currentEmployeeVinculo = currentEmployee?.vinculo;

  if (currentEmployeeType === "Professor" && normalizedCurrentFunction.includes("gestor")) {
    PdfPreviewComponent = TimesheetPdfPreviewV2;
  }
  else if (currentEmployeeVinculo === "Educador Voluntário 20H") {
    PdfPreviewComponent = TimesheetPdfPreviewV6;
  }
  else if (currentEmployeeType === "Professor Fundamental II" && (currentEmployeeVinculo === "Prestador(a) de Serviços" || currentEmployeeVinculo === "Contrato")) {
    PdfPreviewComponent = TimesheetPdfPreviewV5;
  }
  else if (currentEmployeeType === "Professor Fundamental II" && currentEmployeeVinculo === "Efetivo") {
    PdfPreviewComponent = TimesheetPdfPreviewV5;
  }
  else if (currentEmployeeVinculo === "Educador Voluntário") {
    PdfPreviewComponent = TimesheetPdfPreviewV4;
  }
  else if ((currentEmployeeType === "Vigia" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("vigia")) ||
           (normalizedCurrentFunction.includes("asg") && currentEmployeeVinculo === "Contrato") ||
           (currentEmployeeType === "Psicólogo(a)" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("psicologa")) ||
           (currentEmployeeType === "Nutricionista" && currentEmployeeVinculo === "Contrato") ||
           (currentEmployeeType === "Merendeira" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("merendeira")) ||
           (currentEmployeeType === "Supervisor(a)" && currentEmployeeVinculo === "Contrato" && normalizedCurrentFunction.includes("supervisora"))) {
    PdfPreviewComponent = TimesheetPdfPreviewV3;
  }
  else if (currentEmployeeType === "Professor" && currentEmployeeVinculo === "Contrato") {
    PdfPreviewComponent = TimesheetPdfPreviewV2;
  }
  else {
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
              {/* Campo de pesquisa separado */}
              <div>
                <Label htmlFor="employee-search">Buscar Funcionário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="employee-search"
                    type="text"
                    placeholder="Buscar por nome, matrícula, função, escola ou turno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
              </div>

              {/* Seleção de Funcionário (Combobox) */}
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
                        ? `${currentEmployee.name} (${currentEmployee.registration_number || 'N/A'}) - ${currentEmployee.function} - ${currentEmployee.shift?.join(', ') || 'N/A'} - ${currentEmployee.school_name || 'N/A'}`
                        : "Selecione um funcionário..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {filteredEmployees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={`${normalizeString(employee.name)} ${normalizeString(employee.registration_number)} ${normalizeString(employee.function)} ${normalizeString(employee.school_name)} ${normalizeString(employee.shift?.join(' '))}`}
                              onSelect={() => {
                                setSelectedEmployeeId(employee.id === selectedEmployeeId ? null : employee.id);
                                setIsComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {employee.name} ({employee.registration_number || 'N/A'}) - {employee.function} - {employee.shift?.join(', ') || 'N/A'} - {employee.school_name || 'N/A'}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
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