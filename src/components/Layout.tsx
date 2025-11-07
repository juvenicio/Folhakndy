"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSession } from "./SessionContextProvider";
import UnusableSystemDialog from "./UnusableSystemDialog"; // Importar o novo componente

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { session, loading } = useSession();

  const [isCollapsed, setIsCollapsed] = React.useState(isMobile); // isCollapsed means sidebar is closed on mobile

  // Default layout for desktop. On mobile, the sidebar is an overlay, so the main content takes 100%.
  const defaultLayout = isMobile ? [100] : [20, 80];

  if (loading || !session) {
    return null;
  }

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/employees":
        return "Gerenciamento de Funcionários";
      case "/generate-timesheet":
        return "Gerar Folha de Ponto";
      default:
        return "Página Não Encontrada";
    }
  };

  const currentPageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex min-h-screen relative"> {/* Adicionado 'relative' para posicionamento do GIF */}
      {/* O diálogo de sistema inutilizável será exibido aqui, cobrindo todo o conteúdo */}
      <UnusableSystemDialog />

      {/* Mobile Sidebar Overlay and Backdrop */}
      {isMobile && !isCollapsed && ( // If mobile and sidebar is open
        <div
          className="fixed inset-0 z-40 bg-black/50" // Backdrop
          onClick={() => setIsCollapsed(true)} // Close sidebar on backdrop click
        />
      )}
      {isMobile && ( // Render sidebar always on mobile, control visibility via CSS
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* Desktop Layout or Mobile Main Content */}
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
        }}
        className={cn("min-h-screen items-stretch", isMobile && "w-full")} // Ensure main content takes full width on mobile
      >
        {!isMobile && ( // Only render sidebar panel on desktop
          <ResizablePanel
            defaultSize={defaultLayout[0]} // This will be 20 for desktop
            collapsedSize={4}
            collapsible={true}
            minSize={15}
            maxSize={25}
            onCollapse={() => {
              setIsCollapsed(true);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
            }}
            onExpand={() => {
              setIsCollapsed(false);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
            }}
            className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
          >
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </ResizablePanel>
        )}
        <ResizablePanel defaultSize={isMobile ? 100 : defaultLayout[1]}> {/* This will be 100 for mobile, 80 for desktop */}
          <div className="flex flex-col h-full">
            <Header
              title={currentPageTitle}
              isSidebarCollapsed={isCollapsed}
              setIsSidebarCollapsed={setIsCollapsed}
            />
            <main className="flex-1 p-6 overflow-auto flex flex-col">
              {children}
              <Footer />
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* GIF da árvore de Natal */}
      <img
        src="/christmas-tree.gif"
        alt="Árvore de Natal"
        className="fixed bottom-4 right-4 w-20 h-20 object-contain z-50" // Posicionamento e tamanho
      />
    </div>
  );
};

export default Layout;