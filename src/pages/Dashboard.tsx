"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, FileClock, BriefcaseBusiness, Trash2 } from "lucide-react"; // Adicionado Trash2
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Importar Button

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
  const [isResetting, setIsResetting] = useState(false); // Novo estado para o loading do reset

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetTimesheets = async () => {
    if (!window.confirm("Tem certeza que deseja zerar TODAS as folhas de ponto geradas? Esta ação é irreversível.")) {
      return;
    }

    setIsResetting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Você precisa estar logado para realizar esta ação.");
      setIsResetting(false);
      return;
    }

    try {
      // Excluir todas as folhas de ponto do usuário
      const { error: deleteError } = await supabase
        .from("timesheets")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      toast.success("Todas as folhas de ponto foram zeradas com sucesso!");
      fetchData(); // Atualizar os dados do dashboard
    } catch (error: any) {
      console.error("Erro ao zerar folhas de ponto:", error);
      toast.error("Erro ao zerar folhas de ponto: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mb-8 p-6 text-center shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-48 mx-auto" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Folhas de Ponto Geradas</CardTitle>
              <FileClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Função</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Seção de Boas-Vindas */}
      <Card className="mb-8 p-6 text-center shadow-sm hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-4">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Bem-vindo ao seu Dashboard!
          </h1>
          <p className="text-lg text-muted-foreground">
            Visão geral rápida dos seus dados de gerenciamento.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <Users className="h-16 w-16 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-foreground">
            Você tem <span className="text-primary">{totalEmployees}</span> funcionários cadastrados.
          </p>
        </CardContent>
      </Card>

      {/* Cartões de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários ativos
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folhas de Ponto Geradas</CardTitle>
            <FileClock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTimesheets}</div>
            <p className="text-xs text-muted-foreground">
              Documentos criados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Função */}
      <Card className="shadow-sm hover:shadow-lg transition-shadow duration-200 mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Funcionários por Função</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
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

      {/* Cartão de Ações Administrativas */}
      <Card className="shadow-sm hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg">Ações Administrativas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cuidado: Esta ação excluirá permanentemente todas as folhas de ponto e seus registros diários associados para sua conta.
          </p>
          <Button
            variant="destructive"
            onClick={handleResetTimesheets}
            disabled={isResetting || totalTimesheets === 0}
          >
            {isResetting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                Zerando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Zerar Folhas de Ponto
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;