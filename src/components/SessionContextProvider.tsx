"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          toast.info("Você foi desconectado.");
          navigate("/login");
        } else if (currentSession && location.pathname === "/login") {
          // Se o usuário logou e estava na página de login, redireciona para o dashboard
          navigate("/dashboard");
        } else if (!currentSession && location.pathname !== "/login") {
          // Se não estiver logado e não estiver na página de login, redireciona para o login
          navigate("/login");
        }
        // Se estiver logado e na página principal (/), permanece lá para ver os cartões.
        // Se estiver logado e em outras páginas, permanece lá.
      }
    );

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);
      if (!initialSession && location.pathname !== "/login") {
        navigate("/login");
      } else if (initialSession && location.pathname === "/login") {
        navigate("/dashboard"); // Redireciona para o dashboard após login inicial
      }
      // Se estiver logado e na página principal (/), permanece lá para ver os cartões.
      // Se estiver logado e em outras páginas, permanece lá.
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando autenticação...</p>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};