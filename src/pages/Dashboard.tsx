"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, FileClock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Employee {
  id: string;
  name: string;
  function: string;
}

interface Timesheet {
  id: string;
}

interface FunctionDistribution {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF69B4', '#32CD32'];

const Dashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalTimesheets, setTotalTimesheets] = useState<number>(0);
  const [functionDistribution, setFunctionDistribution] = useState<FunctionDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar logado para ver o dashboard.");
        setLoading(false);
        return;
      }

      // Fetch total employees
      const { count: employeesCount, error: employeesError } = await supabase
        .from("employees")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      if (employeesError) {
        toast.error("Erro ao carregar total de funcionários: " + employeesError.message);
        console.error("Erro ao carregar total de funcionários:", employeesError);
      } else {
        setTotalEmployees(employeesCount || 0);
      }

      // Fetch total timesheets
      const { count: timesheetsCount, error: timesheetsError } = await supabase
        .from("timesheets")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      if (timesheetsError) {
        toast.error("Erro ao carregar total de folhas de ponto: " + timesheetsError.message);
        console.error("Erro ao carregar total de folhas de ponto:", timesheetsError);
      } else {
        setTotalTimesheets(timesheetsCount || 0);
      }

      // Fetch employees for function distribution
      const { data: employeesData, error: employeesDataError } = await supabase
        .from("employees")
        .select("function")
        .eq("user_id", user.id);

      if (employeesDataError) {
        toast.error("Erro ao carregar dados de funcionários para o gráfico: " + employeesDataError.message);
        console.error("Erro ao carregar dados de funcionários para o gráfico:", employeesDataError);
      } else {
        const distributionMap = new Map<string, number>();
        employeesData?.forEach(employee => {
          const func = employee.function || "Não Definido";
          distributionMap.set(func, (distributionMap.get(func) || 0) + 1);
        });
        const formattedDistribution = Array.from(distributionMap.entries()).map(([name, value]) => ({ name, value }));
        setFunctionDistribution(formattedDistribution);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-10 text-primary">
          Carregando Dashboard...
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Folhas de Ponto Geradas</CardTitle>
              <FileClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Função</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Carregando gráfico...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-primary">
        Bem-vindo ao seu Dashboard!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folhas de Ponto Geradas</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTimesheets}</div>
            <p className="text-xs text-muted-foreground">
              Folhas de ponto criadas
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Função</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {functionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={functionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {functionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum funcionário cadastrado para exibir o gráfico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;