"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EmployeeForm from "@/components/EmployeeForm";
import { Edit, Trash2, PlusCircle, Search, Users } from "lucide-react";
import EmployeeTableSkeleton from "@/components/EmployeeTableSkeleton";
import { normalizeString } from "@/lib/utils";
import { Employee } from "@/types";
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useSession(); // Obter user do contexto

  const fetchEmployees = async () => {
    setLoading(true);
    if (!user) {
      toast.error("Você precisa estar logado para ver os funcionários.");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("employees")
      .select("*")
      .eq("user_id", user.id) // Filtrar por user_id (gerente que criou)
      .order("name", { ascending: true });

    // Adicionar filtro de escola se managed_school_name existir no perfil (Removido)
    // if (profile?.managed_school_name) {
    //   query = query.eq("school_name", profile.managed_school_name);
    // }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar funcionários: " + error.message);
      console.error("Erro ao carregar funcionários:", error);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) { // Só busca funcionários se o usuário estiver logado
      fetchEmployees();
    }
  }, [user]); // Removido profile como dependência

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      return;
    }
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir funcionário: " + error.message);
      console.error("Erro ao excluir funcionário:", error);
    } else {
      toast.success("Funcionário excluído com sucesso!");
      fetchEmployees();
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchEmployees();
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingEmployee(null);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    return (
      normalizeString(employee.name).includes(normalizedSearchTerm) ||
      normalizeString(employee.employee_type).includes(normalizedSearchTerm) ||
      normalizeString(employee.function).includes(normalizedSearchTerm) ||
      normalizeString(employee.registration_number).includes(normalizedSearchTerm) ||
      normalizeString(employee.school_name).includes(normalizedSearchTerm) ||
      normalizeString(employee.vinculo).includes(normalizedSearchTerm) ||
      normalizeString(employee.discipline).includes(normalizedSearchTerm) ||
      normalizeString(employee.weekly_hours?.toString()).includes(normalizedSearchTerm) ||
      (employee.shift && employee.shift.some(s => normalizeString(s).includes(normalizedSearchTerm)))
    );
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Funcionários</h1>

      <Card className="mb-6 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4">
          <div className="relative flex-grow md:mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, cargo, função, matrícula, escola, vínculo, disciplina, carga horária ou turno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEmployee(null)} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "Editar Funcionário" : "Adicionar Novo Funcionário"}</DialogTitle>
              </DialogHeader>
              <EmployeeForm employee={editingEmployee} onSuccess={handleFormSuccess} />
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmployeeTableSkeleton />
          ) : filteredEmployees.length === 0 && employees.length > 0 && searchTerm !== "" ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Search className="h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-semibold mb-2">Nenhum funcionário encontrado.</p>
              <p className="text-md mb-4">Tente ajustar seu termo de busca ou limpar a pesquisa.</p>
              <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">Limpar Busca</Button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 text-gray-400" />
              <p className="text-xl font-semibold mb-2">Nenhum funcionário cadastrado ainda.</p>
              <p className="text-md mb-4">Comece adicionando seu primeiro funcionário para gerar folhas de ponto.</p>
              <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingEmployee(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm employee={editingEmployee} onSuccess={handleFormSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Carga Horária Semanal</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Turno(s)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.vinculo}</TableCell>
                      <TableCell>{employee.employee_type}</TableCell>
                      <TableCell>{employee.function}</TableCell>
                      <TableCell>{employee.discipline || '-'}</TableCell>
                      <TableCell>{employee.weekly_hours ? `${employee.weekly_hours} H` : '-'}</TableCell>
                      <TableCell>{employee.registration_number || '-'}</TableCell>
                      <TableCell>{employee.school_name || '-'}</TableCell>
                      <TableCell>{employee.shift?.join(', ') || "-"}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(employee.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;