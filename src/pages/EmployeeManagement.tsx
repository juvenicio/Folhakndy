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

interface Employee {
  id: string;
  name: string;
  employee_type: string; // Novo: "Cargo"
  function: string; // Existente: "Função"
  registration_number: string;
  school_name: string | null;
  work_days: string[];
  shift: string[] | null;
  vinculo: string; // Novo: "Tipo de Vínculo"
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para ver os funcionários.");
      setLoading(false);
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
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      employee.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.employee_type.toLowerCase().includes(lowerCaseSearchTerm) || // Novo campo
      employee.function.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.registration_number.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.school_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      employee.vinculo.toLowerCase().includes(lowerCaseSearchTerm) || // Novo campo
      (employee.shift && employee.shift.some(s => s.toLowerCase().includes(lowerCaseSearchTerm)))
    );
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Funcionários</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-4">
          <div className="relative flex-grow md:mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, cargo, função, matrícula, escola, vínculo ou turno..."
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmployeeTableSkeleton />
          ) : filteredEmployees.length === 0 && employees.length > 0 && searchTerm !== "" ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Search className="h-12 w-12 mb-4" />
              <p className="text-lg">Nenhum funcionário encontrado com o termo de busca "{searchTerm}".</p>
              <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">Limpar Busca</Button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhum funcionário cadastrado ainda.</p>
              <p className="mb-4">Comece adicionando seu primeiro funcionário para gerar folhas de ponto.</p>
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
                    <TableHead>Vínculo</TableHead> {/* Novo cabeçalho */}
                    <TableHead>Cargo</TableHead> {/* Novo cabeçalho */}
                    <TableHead>Função</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Turno(s)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.vinculo}</TableCell> {/* Novo campo */}
                      <TableCell>{employee.employee_type}</TableCell> {/* Novo campo */}
                      <TableCell>{employee.function}</TableCell>
                      <TableCell>{employee.registration_number}</TableCell>
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