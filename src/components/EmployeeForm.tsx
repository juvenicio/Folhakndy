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
import { Employee } from "@/types";
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession

const employeeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  employee_type: z.enum(["ASG", "Merendeira", "Vigia", "Secretário(a)", "Professor", "Assistente Social", "Psicólogo(a)", "Gestor(a)", "Educador Voluntário", "Professor Fundamental II", "Supervisor(a)", "Nutricionista"], {
    required_error: "Cargo é obrigatório",
  }),
  function: z.string().min(1, "Função é obrigatória"),
  registration_number: z.string().nullable().optional().transform(e => e === "" ? null : e),
  school_name: z.string().min(1, "Nome da Escola é obrigatório"),
  vinculo: z.enum(["Efetivo", "Contrato", "Terceirizado(a)", "Educador Voluntário", "Prestador(a) de Serviços", "Educador Voluntário 20H"], {
    required_error: "Tipo de vínculo é obrigatório",
  }),
  discipline: z.string().nullable().optional().transform(e => e === "" ? null : e),
  weekly_hours: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().nullable().optional().refine(val => val === null || val >= 0, {
      message: "Carga horária deve ser um número positivo ou vazio",
    })
  ),
  shift: z.array(z.enum(["Manhã", "Tarde", "Noite"])).min(1, "Selecione pelo menos um turno"),
  work_days: z.array(z.string()).min(1, "Selecione pelo menos um dia de trabalho"),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: Employee;
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
  const { user } = useSession(); // Obter user do contexto

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: employee?.name || "",
      employee_type: employee?.employee_type || "ASG",
      function: employee?.function || "",
      registration_number: employee?.registration_number || null,
      school_name: employee?.school_name || "", // Revertido para valor padrão vazio
      vinculo: employee?.vinculo || "Efetivo",
      discipline: employee?.discipline || null,
      weekly_hours: employee?.weekly_hours || null,
      shift: employee?.shift || [],
      work_days: employee?.work_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  });

  // Desabilitar o campo school_name se o usuário tiver uma escola gerenciada e não estiver editando um funcionário existente (Removido)
  // const isSchoolNameFixed = !!profile?.managed_school_name && !employee;

  const onSubmit = async (values: EmployeeFormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para gerenciar funcionários.");
      return;
    }

    const dataToSave = {
      ...values,
      user_id: user.id,
      // Se o campo school_name estiver fixo pelo perfil, garantir que o valor enviado seja o do perfil (Removido)
      // school_name: isSchoolNameFixed ? profile?.managed_school_name : values.school_name,
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
          registration_number: null,
          school_name: "", // Revertido para valor padrão vazio
          vinculo: "Efetivo",
          discipline: null,
          weekly_hours: null,
          shift: [],
          work_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        });
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
                  <SelectItem value="Prestador(a) de Serviços">Prestador(a) de Serviços</SelectItem>
                  <SelectItem value="Educador Voluntário 20H">Educador Voluntário 20H</SelectItem>
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
                  <SelectItem value="Professor Fundamental II">Professor Fundamental II</SelectItem>
                  <SelectItem value="Assistente Social">Assistente Social</SelectItem>
                  <SelectItem value="Psicólogo(a)">Psicólogo(a)</SelectItem>
                  <SelectItem value="Gestor(a)">Gestor(a)</SelectItem>
                  <SelectItem value="Educador Voluntário">Educador Voluntário</SelectItem>
                  <SelectItem value="Supervisor(a)">Supervisor(a)</SelectItem>
                  <SelectItem value="Nutricionista">Nutricionista</SelectItem>
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
          name="discipline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplina</FormLabel>
              <FormControl>
                <Input placeholder="Disciplina (ex: Artes, Matemática)" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weekly_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carga Horária Semanal (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Carga horária semanal"
                  {...field}
                  value={field.value === null ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : Number(value));
                  }}
                />
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
                <Input
                  placeholder="Nome da escola"
                  {...field}
                  // disabled={isSchoolNameFixed} // Removido
                />
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