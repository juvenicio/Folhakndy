"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getDaysInMonth, format, parseISO, isValid, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, FileDown, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { normalizeString } from "@/lib/utils";
import BatchTimesheetPdfPreview from "./BatchTimesheetPdfPreview";

// Interfaces (repetidas aqui para clareza, mas idealmente seriam importadas de um arquivo de tipos comum)
interface Employee {
  id: string;
  name: string;
  employee_type: string;
  function: string;
  registration_number: string;
  school_name: string | null;
  work_days: string[];
  shift: string[] | null;
  vinculo: string;
  discipline: string | null;
  weekly_hours: number | null;
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

interface BatchTimesheetData {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
}

interface BatchTimesheetGeneratorProps {
  employees: Employee[];
  logoBase64: string | null;
}

const BatchTimesheetGenerator = ({ employees, logoBase64 }: BatchTimesheetGeneratorProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [generatedBatchTimesheets, setGeneratedBatchTimesheets] = useState<BatchTimesheetData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const daysOfWeekMapForComparison: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  const daysOfWeekMapForDisplay: { [key: number]: string } = {
    0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
  };

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

  const generateBatchTimesheets = async () => {
    if (selectedEmployeeIds.length === 0 || !selectedDate) {
      toast.error("Por favor, selecione pelo menos um funcionário e um mês/ano.");
      return;
    }

    setLoading(true);
    const batchResults: BatchTimesheetData[] = [];
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para gerar folhas de ponto.");
      setLoading(false);
      return;
    }

    for (const employeeId of selectedEmployeeIds) {
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) {
        toast.error(`Funcionário com ID ${employeeId} não encontrado.`);
        continue;
      }

      const daysInMonth = getDaysInMonth(new Date(year, month - 1));
      const dailyRecords: DailyRecord[] = [];

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

          if (employee.employee_type === "Professor Fundamental II" && (employee.vinculo === "Prestador(a) de Serviços" || employee.vinculo === "Contrato")) {
            if (isCurrentDateWeekend) {
              notes = dayNamePtBr.toUpperCase();
            } else if (!isWorkDay) {
              notes = null;
            }
          } else if (employee.vinculo === "Educador Voluntário") {
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
          } else {
            const normalizedEmployeeFunction = normalizeString(employee.function);
            if (normalizedEmployeeFunction.includes("asg") && employee.vinculo === "Contrato") {
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
            } else {
              if (!isWorkDay) {
                if (isCurrentDateWeekend) {
                  notes = dayNamePtBr;
                } else {
                  notes = "SÁBADO E DOMINGO";
                }
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

        batchResults.push({
          employee,
          month,
          year,
          dailyRecords: fetchedDailyRecords as DailyRecord[],
        });

      } catch (error: any) {
        console.error(`Erro ao gerar folha de ponto para ${employee.name}:`, error);
        toast.error(`Erro ao gerar folha de ponto para ${employee.name}: ${error.message || "Erro desconhecido"}`);
      }
    }

    if (batchResults.length > 0) {
      setGeneratedBatchTimesheets(batchResults);
      toast.success("Folhas de ponto em lote geradas e salvas com sucesso!");
    } else {
      setGeneratedBatchTimesheets(null);
      toast.error("Nenhuma folha de ponto foi gerada com sucesso.");
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === employees.length) {
      // All are selected, deselect all
      setSelectedEmployeeIds([]);
    } else {
      // Not all are selected, select all
      setSelectedEmployeeIds(employees.map(emp => emp.id));
    }
  };

  const getComboboxTriggerText = () => {
    if (selectedEmployeeIds.length === 0) {
      return "Selecione funcionários...";
    }
    if (selectedEmployeeIds.length === employees.length) {
      return "Todos os funcionários selecionados";
    }
    return `${selectedEmployeeIds.length} funcionário(s) selecionado(s)`;
  };

  return (
    <Card className="mb-8 shadow-sm">
      <CardHeader>
        <CardTitle>Gerar Folhas de Ponto em Lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="employee-select-batch">Selecionar Funcionários</Label>
          <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isComboboxOpen}
                className="w-full justify-between"
              >
                {getComboboxTriggerText()}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Pesquisar funcionário..." />
                <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleSelectAll}
                    className="flex items-center justify-between text-primary font-semibold"
                  >
                    <span>
                      {selectedEmployeeIds.length === employees.length ? "Desselecionar Todos" : "Selecionar Todos"}
                    </span>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedEmployeeIds.length === employees.length ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={`${normalizeString(employee.name)} ${normalizeString(employee.registration_number)} ${normalizeString(employee.function)} ${normalizeString(employee.school_name)}`}
                      onSelect={() => {
                        setSelectedEmployeeIds((prev) =>
                          prev.includes(employee.id)
                            ? prev.filter((id) => id !== employee.id)
                            : [...prev, employee.id]
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmployeeIds.includes(employee.id) ? "opacity-100" : "opacity-0"
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
          <Label htmlFor="month-year-picker-batch">Mês e Ano</Label>
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
          <Button onClick={generateBatchTimesheets} disabled={loading || selectedEmployeeIds.length === 0 || !selectedDate} className="flex-1">
            {loading ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-pulse" />
                Gerando em Lote...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Folhas de Ponto em Lote
              </>
            )}
          </Button>
          <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!generatedBatchTimesheets || generatedBatchTimesheets.length === 0}
                onClick={() => setIsPdfPreviewOpen(true)}
              >
                <FileDown className="mr-2 h-4 w-4" /> Visualizar PDF em Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-5xl h-[90vh] p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Pré-visualização de Folhas de Ponto em Lote</DialogTitle>
              </DialogHeader>
              {generatedBatchTimesheets && (
                <BatchTimesheetPdfPreview
                  batchData={generatedBatchTimesheets}
                  logoSrc={logoBase64}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchTimesheetGenerator;