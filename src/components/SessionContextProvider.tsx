"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
// import { Profile } from "@/types"; // Removido

interface SessionContextType {
  session: Session | null;
  user: User | null;
  // profile: Profile | null; // Removido
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // const [profile, setProfile] = useState<Profile | null>(null); // Removido
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // const fetchUserProfile = async (userId: string) => { ... } // Removido

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);

        // if (currentSession?.user) {
        //   await fetchUserProfile(currentSession.user.id); // Removido
        // } else {
        //   setProfile(null); // Removido
        // }

        if (event === "SIGNED_OUT") {
          toast.info("Você foi desconectado.");
          navigate("/login");
        } else if (currentSession && location.pathname === "/login") {
          navigate("/dashboard");
        } else if (!currentSession && location.pathname !== "/login") {
          navigate("/login");
        }
      }
    );

    // Buscar sessão inicial e perfil
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      // if (initialSession?.user) {
      //   await fetchUserProfile(initialSession.user.id); // Removido
      // }
      setLoading(false);
      if (!initialSession && location.pathname !== "/login") {
        navigate("/login");
      } else if (initialSession && location.pathname === "/login") {
        navigate("/dashboard");
      }
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