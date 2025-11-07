"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UnusableSystemDialog = () => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
      console.error("Erro ao fazer logout:", error);
    } else {
      toast.success("Desconectado com sucesso!");
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}> {/* Diálogo sempre aberto e não pode ser fechado */}
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Acesso Restrito</DialogTitle>
          <DialogDescription className="text-md mt-2">
            Para continuar usando nossos sistemas, entre em contato com o desenvolvedor.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Button onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sair do Sistema
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnusableSystemDialog;