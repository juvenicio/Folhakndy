"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyRecord, Employee } from "@/types"; // Importando as interfaces

interface TimesheetDisplayProps {
  employee: Employee;
  month: number;
  year: number;
  dailyRecords: DailyRecord[];
}

const TimesheetDisplay = ({ employee, month, year, dailyRecords }: TimesheetDisplayProps) => {
  const monthName = format(new Date(year, month - 1), "MMMM", { locale: ptBR });

  const calculateTotalHours = () => {
    return dailyRecords.reduce((sum, record) => sum + (record.total_hours_worked || 0), 0);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Folha de Ponto</CardTitle>
        <CardDescription className="text-center text-lg">
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)} de {year}
        </CardDescription>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div>
            <p><strong>Funcionário:</strong> {employee.name}</p>
            <p><strong>Vínculo:</strong> {employee.vinculo}</p>
            <p><strong>Cargo:</strong> {employee.employee_type}</p>
            <p><strong>Função:</strong> {employee.function}</p>
            <p><strong>Disciplina:</strong> {employee.discipline || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p><strong>Matrícula:</strong> {employee.registration_number}</p>
            <p><strong>Escola:</strong> {employee.school_name || 'N/A'}</p>
            <p><strong>Carga Horária Semanal:</strong> {employee.weekly_hours ? `${employee.weekly_hours} H` : 'N/A'}</p>
            <p><strong>Período:</strong> {monthName.charAt(0).toUpperCase() + monthName.slice(1)}/{year}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Dia</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Entrada 1</TableHead>
                <TableHead>Saída 1</TableHead>
                <TableHead>Entrada 2</TableHead>
                <TableHead>Saída 2</TableHead>
                <TableHead className="text-right">Total Horas</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyRecords.map((record, index) => {
                const date = isValid(parseISO(record.record_date)) ? parseISO(record.record_date) : null;
                return (
                  <TableRow key={record.id || index}>
                    <TableCell className="font-medium">{date ? format(date, "dd", { locale: ptBR }) : "-"}</TableCell>
                    <TableCell>{date ? format(date, "EEE, dd/MM", { locale: ptBR }) : "-"}</TableCell>
                    <TableCell>{record.entry_time_1 || "-"}</TableCell>
                    <TableCell>{record.exit_time_1 || "-"}</TableCell>
                    <TableCell>{record.entry_time_2 || "-"}</TableCell>
                    <TableCell>{record.exit_time_2 || "-"}</TableCell>
                    <TableCell className="text-right">{record.total_hours_worked?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{record.notes || "-"}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={6} className="text-right">Total de Horas Trabalhadas no Mês:</TableCell>
                <TableCell className="text-right">{calculateTotalHours().toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetDisplay;