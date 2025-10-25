"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  employee_type: z.enum(["ASG", "Merendeira", "Vigia", "Secretário(a)", "Professor", "Assistente Social", "Psicólogo(a)", "Gestor(a)"], {
    required_error: "Cargo é obrigatório",
  }),
  function: z.string().min(1, "Função é obrigatória"),
  registration_number: z.string().nullable().optional().transform(e => e === "" ? null : e), // Modificado para tratar string vazia como null
  school_name: z.string().min(1, "Nome da Escola é obrigatório"),
  vinculo: z.enum(["Efetivo", "Contrato", "Terceirizado(a)", "Educador Voluntário"], {
    required_error: "Tipo de vínculo é obrigatório",
  }),
  shift: z.array(z.enum(["Manhã", "Tarde", "Noite"])).min(1, "Selecione pelo menos um turno"),
  work_days: z.array(z.string()).min(1, "Selecione pelo menos um dia de trabalho"),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: any; // Existing employee data for editing
  onSuccess: () => void;
}

const daysOfWeek = [
  { id: "Monday", label: "Segunda-feira" },
  { id: "Tuesday", label: "Terça-feira" },
  { id: "Wednesday", label: "Quarta-feira" },
  { id: "Thursday", label: "Quinta-feira" },
  { id: "Friday", label: "Sexta-feira" },
  { id: "Saturday", label: "Sábado" },
  { id: "Sunday", label: "Domingo" },
];

const shifts = [
  { id: "Manhã", label: "Manhã" },
  { id: "Tarde", label: "Tarde" },
  { id: "Noite", label: "Noite" },
];

const EmployeeForm = ({ employee, onSuccess }: EmployeeFormProps) => {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: employee?.name || "",
      employee_type: employee?.employee_type || "ASG", // Novo campo
      function: employee?.function || "",
      registration_number: employee?.registration_number || null, // Definir como null por padrão
      school_name: employee?.school_name || "",
      vinculo: employee?.vinculo || "Efetivo", // Novo campo
      shift: employee?.shift || [],
      work_days: employee?.work_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  });

  const onSubmit = async (values: EmployeeFormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para gerenciar funcionários.");
      return;
    }

    const dataToSave = {
      ...values,
      user_id: user.id,
    };

    try {
      if (employee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update(dataToSave)
          .eq("id", employee.id);

        if (error) throw error;
        toast.success("Funcionário atualizado com sucesso!");
      } else {
        // Add new employee
        const { error } = await supabase
          .from("employees")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Funcionário adicionado com sucesso!");
        form.reset({
          name: "",
          employee_type: "ASG",
          function: "",
          registration_number: null, // Limpar para null após o sucesso
          school_name: "",
          vinculo: "Efetivo",
          shift: [],
          work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        }); // Clear form after successful submission
      }
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar funcionário:", error);
      toast.error(error.message || "Erro ao salvar funcionário.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do funcionário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vinculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Vínculo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de vínculo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Efetivo">Efetivo</SelectItem>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="Terceirizado(a)">Terceirizado(a)</SelectItem>
                  <SelectItem value="Educador Voluntário">Educador Voluntário</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employee_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ASG">ASG</SelectItem>
                  <SelectItem value="Merendeira">Merendeira</SelectItem>
                  <SelectItem value="Vigia">Vigia</SelectItem>
                  <SelectItem value="Secretário(a)">Secretário(a)</SelectItem>
                  <SelectItem value="Professor">Professor</SelectItem>
                  <SelectItem value="Assistente Social">Assistente Social</SelectItem>
                  <SelectItem value="Psicólogo(a)">Psicólogo(a)</SelectItem>
                  <SelectItem value="Gestor(a)">Gestor(a)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="function"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <FormControl>
                <Input placeholder="Função (ex: A.S.G, Merendeira)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="registration_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="Número de matrícula" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="school_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Escola</FormLabel>
              <FormControl>
                <Input placeholder="Nome da escola" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shift"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-base">Turno</FormLabel>
              </div>
              <div className="flex flex-wrap gap-4">
                {shifts.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="shift"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="work_days"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-base">Dias de Trabalho</FormLabel>
              </div>
              {daysOfWeek.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="work_days"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{employee ? "Atualizar Funcionário" : "Adicionar Funcionário"}</Button>
      </form>
    </Form>
  );
};

export default EmployeeForm;