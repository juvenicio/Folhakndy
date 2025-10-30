"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle"; // Importar o ThemeToggle

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({ title, className, isSidebarCollapsed, setIsSidebarCollapsed, ...props }: HeaderProps) => {
  return (
    <header
      className={cn(
        "flex items-center h-14 border-b bg-background px-4 shadow-sm", // Adicionado shadow-sm
        className,
      )}
      {...props}
    >
      {/* Botão de menu hambúrguer, sempre visível para mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 md:hidden"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="ml-auto"> {/* Adiciona o ThemeToggle aqui */}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;