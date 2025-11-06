"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, isValid, getDay, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyRecord, Employee } from "@/types";
import { toast } from "sonner";
import { Save, XCircle } from "lucide-react";

interface EditableDailyRecordsTableProps {
  employee: Employee;
  month: number;
  year: number;
  initialDailyRecords: DailyRecord[];
  onSave: (updatedRecords: DailyRecord[]) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const daysOfWeekMapForComparison: { [key: number]: string } = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};

const daysOfWeekMapForDisplay: { [key: number]: string } = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
};

const EditableDailyRecordsTable = ({
  employee,
  month,
  year,
  initialDailyRecords,
  onSave,
  onCancel,
  isLoading,
}: EditableDailyRecordsTableProps) => {
  const [editableRecords, setEditableRecords] = useState<DailyRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Ensure all days of the month are present, even if no initial record
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const fullMonthRecords: DailyRecord[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month - 1, i);
      const recordDate = format(currentDate, "yyyy-MM-dd");
      const existingRecord = initialDailyRecords.find(r => r.record_date === recordDate);

      if (existingRecord) {
        fullMonthRecords.push({ ...existingRecord });
      } else {
        // Create a placeholder record for days without data
        fullMonthRecords.push({
          id: `new-${recordDate}`, // Temporary ID for new records
          record_date: recordDate,
          entry_time_1: null,
          exit_time_1: null,
          entry_time_2: null,
          exit_time_2: null,
          total_hours_worked: null,
          notes: null,
        });
      }
    }
    setEditableRecords(fullMonthRecords);
    setHasChanges(false); // Reset changes flag on initial load
  }, [initialDailyRecords, month, year]);

  const calculateHours = useCallback((entry1: string | null, exit1: string | null, entry2: string | null, exit2: string | null): number => {
    let totalMinutes = 0;

    const parseTime = (timeStr: string | null): number => {
      if (!timeStr) return NaN;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return NaN;
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      if (isNaN(hours) || isNaN(minutes)) return NaN;
      return hours * 60 + minutes;
    };

    const start1 = parseTime(entry1);
    const exit1Parsed = parseTime(exit1);
    if (!isNaN(start1) && !isNaN(exit1Parsed) && exit1Parsed > start1) {
      totalMinutes += (exit1Parsed - start1);
    }

    const start2 = parseTime(entry2);
    const exit2Parsed = parseTime(exit2);
    if (!isNaN(start2) && !isNaN(exit2Parsed) && exit2Parsed > start2) {
      totalMinutes += (exit2Parsed - start2);
    }

    const hours = totalMinutes / 60;
    return isNaN(hours) ? 0 : hours;
  }, []);

  const handleFieldChange = (
    index: number,
    field: keyof DailyRecord,
    value: string | number | null
  ) => {
    setEditableRecords((prevRecords) => {
      const newRecords = [...prevRecords];
      const recordToUpdate = { ...newRecords[index], [field]: value };

      // Recalculate total_hours_worked if time fields change
      if (
        field === "entry_time_1" ||
        field === "exit_time_1" ||
        field === "entry_time_2" ||
        field === "exit_time_2"
      ) {
        recordToUpdate.total_hours_worked = calculateHours(
          recordToUpdate.entry_time_1,
          recordToUpdate.exit_time_1,
          recordToUpdate.entry_time_2,
          recordToUpdate.exit_time_2
        );
      }
      newRecords[index] = recordToUpdate;
      setHasChanges(true);
      return newRecords;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }
    await onSave(editableRecords);
    setHasChanges(false);
  };

  const monthName = format(new Date(year, month - 1), "MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Folha de Ponto de {employee.name} - {monthName.charAt(0).toUpperCase() + monthName.slice(1)} de {year}
        </h2>
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            <Save className="mr-2 h-4 w-4" /> Salvar Alterações
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <XCircle className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Dia</TableHead>
              <TableHead className="w-[80px]">Data</TableHead>
              <TableHead className="w-[100px]">Entrada 1</TableHead>
              <TableHead className="w-[100px]">Saída 1</TableHead>
              <TableHead className="w-[100px]">Entrada 2</TableHead>
              <TableHead className="w-[100px]">Saída 2</TableHead>
              <TableHead className="w-[100px] text-right">Total Horas</TableHead>
              <TableHead className="min-w-[200px]">Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableRecords.map((record, index) => {
              const date = isValid(parseISO(record.record_date)) ? parseISO(record.record_date) : null;
              const dayOfWeek = date ? getDay(date) : null;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 for Sunday, 6 for Saturday

              return (
                <TableRow key={record.id || index} className={isWeekend ? "bg-gray-50 dark:bg-gray-800" : ""}>
                  <TableCell className="font-medium">{date ? format(date, "dd", { locale: ptBR }) : "-"}</TableCell>
                  <TableCell>
                    {date ? `${daysOfWeekMapForDisplay[dayOfWeek!]}, ${format(date, "dd/MM", { locale: ptBR })}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={record.entry_time_1 || ""}
                      onChange={(e) => handleFieldChange(index, "entry_time_1", e.target.value || null)}
                      disabled={isLoading || isWeekend}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={record.exit_time_1 || ""}
                      onChange={(e) => handleFieldChange(index, "exit_time_1", e.target.value || null)}
                      disabled={isLoading || isWeekend}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={record.entry_time_2 || ""}
                      onChange={(e) => handleFieldChange(index, "entry_time_2", e.target.value || null)}
                      disabled={isLoading || isWeekend}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={record.exit_time_2 || ""}
                      onChange={(e) => handleFieldChange(index, "exit_time_2", e.target.value || null)}
                      disabled={isLoading || isWeekend}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {record.total_hours_worked?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={record.notes || ""}
                      onChange={(e) => handleFieldChange(index, "notes", e.target.value || null)}
                      disabled={isLoading}
                      placeholder={isWeekend ? daysOfWeekMapForDisplay[dayOfWeek!].toUpperCase() : "Adicionar observação"}
                      className="min-h-[32px] h-8"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EditableDailyRecordsTable;