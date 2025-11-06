"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Users, FileClock, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      to: "/dashboard",
    },
    {
      title: "Funcionários",
      icon: <Users className="h-4 w-4" />,
      to: "/employees",
    },
    {
      title: "Gerar Folha de Ponto",
      icon: <FileClock className="h-4 w-4" />,
      to: "/generate-timesheet",
    },
  ];

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
    <div
      className={cn(
        "flex h-full flex-col gap-4 border-r",
        // Desktop styles
        !isMobile && (isCollapsed ? "w-16" : "w-64 shadow-lg"), // Adicionado shadow-lg para desktop expandido
        !isMobile && "bg-sidebar-background",
        // Mobile styles: always fixed, control visibility with transform
        isMobile && "fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs shadow-lg transform transition-transform duration-300 ease-in-out bg-background", // Usar bg-background para consistência
        isMobile && isCollapsed ? "-translate-x-full" : "translate-x-0"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h1 className={cn("font-bold text-lg text-primary", isCollapsed && "hidden")}> {/* Adicionado text-primary */}
          Folha de Ponto
        </h1>
        <FileClock className={cn("h-6 w-6 text-primary", !isCollapsed && "hidden")} /> {/* Adicionado text-primary */}
        {/* Close button for mobile when sidebar is open */}
        {isMobile && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="ml-auto"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar Sidebar</span>
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="grid gap-1">
          {navItems.map((item) =>
            isCollapsed && !isMobile ? ( // Desktop collapsed state
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={item.to} onClick={() => isMobile && setIsCollapsed(true)}>
                    <Button
                      variant={location.pathname === item.to ? "secondary" : "ghost"}
                      className="h-9 w-9 justify-center"
                    >
                      {item.icon}
                      <span className="sr-only">{item.title}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : ( // Desktop expanded state OR Mobile (always expanded-like visually)
              <Link key={item.title} to={item.to} onClick={() => isMobile && setIsCollapsed(true)}>
                <Button
                  variant={location.pathname === item.to ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Button>
              </Link>
            ),
          )}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-3 border-t">
        {isCollapsed && !isMobile ? ( // Desktop collapsed state
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 justify-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-4">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : ( // Desktop expanded state OR Mobile
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;