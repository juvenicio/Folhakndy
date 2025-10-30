"use client";

import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import Footer from "@/components/Footer"; // Importar o componente Footer

const Login = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (session) {
      // Redireciona para a página de funcionários se o usuário já estiver logado
      navigate("/dashboard"); // Redireciona para o dashboard
    }
  }, [session, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 p-4"> {/* Gradiente mais suave e adaptado ao dark mode */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800 animate-fade-in"> {/* Sombra mais pronunciada, bordas mais arredondadas e animação */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <img src="/logo.png" alt="Logo" className="h-24 w-24 object-contain" />
            <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white leading-tight"> {/* Fonte mais forte */}
              Bem-vindo(a)!
            </h2>
            <p className="text-md text-center text-gray-600 dark:text-gray-300"> {/* Texto mais suave */}
              Acesse sua conta para gerenciar suas folhas de ponto.
            </p>
          </div>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary-foreground))",
                    defaultButtonBackground: "hsl(var(--secondary))",
                    defaultButtonBackgroundHover: "hsl(var(--secondary-foreground))",
                    defaultButtonBorder: "hsl(var(--border))",
                    defaultButtonText: "hsl(var(--secondary-foreground))",
                    defaultButtonTextHover: "hsl(var(--background))",
                    inputBackground: "hsl(var(--background))",
                    inputBorder: "hsl(var(--input))",
                    inputBorderHover: "hsl(var(--input))",
                    inputBorderFocus: "hsl(var(--ring))",
                    inputText: "hsl(var(--foreground))",
                    inputLabel: "hsl(var(--muted-foreground))",
                    inputPlaceholder: "hsl(var(--muted-foreground))",
                    // Cores para o botão principal (brand)
                    brandButtonBackground: "hsl(var(--primary))",
                    brandButtonBackgroundHover: "hsl(var(--primary))", // Pode ser um tom mais escuro se desejar
                    brandButtonBorder: "hsl(var(--primary))",
                    brandButtonText: "hsl(var(--primary-foreground))",
                    brandButtonTextHover: "hsl(var(--primary-foreground))",
                  },
                  radii: {
                    borderRadiusButton: "var(--radius)",
                    inputBorderRadius: "var(--radius)",
                  },
                },
              },
            }}
            theme="light"
            redirectTo={window.location.origin + "/dashboard"} // Redireciona para o dashboard
            localization={{
              variables: {
                sign_in: {
                  email_label: "Endereço de e-mail",
                  password_label: "Sua senha",
                  email_input_placeholder: "Seu endereço de e-mail",
                  password_input_placeholder: "Sua senha",
                  button_label: "Entrar",
                  social_provider_text: "Entrar com {{provider}}",
                  link_text: "Já tem uma conta? Entrar",
                },
                sign_up: {
                  email_label: "Endereço de e-mail",
                  password_label: "Criar uma senha",
                  email_input_placeholder: "Seu endereço de e-mail",
                  password_input_placeholder: "Sua senha",
                  button_label: "Cadastrar",
                  social_provider_text: "Cadastrar com {{provider}}",
                  link_text: "Não tem uma conta? Cadastrar",
                },
                forgotten_password: {
                  email_label: "Endereço de e-mail",
                  password_label: "Sua senha",
                  email_input_placeholder: "Seu endereço de e-mail",
                  button_label: "Enviar instruções de redefinição",
                  link_text: "Esqueceu sua senha?",
                },
                update_password: {
                  password_label: "Nova senha",
                  password_input_placeholder: "Sua nova senha",
                  button_label: "Atualizar senha",
                },
                magic_link: {
                  email_input_placeholder: "Seu endereço de e-mail",
                  button_label: "Enviar link mágico",
                  link_text: "Enviar um link mágico por e-mail",
                },
                verify_otp: {
                  email_input_placeholder: "Seu endereço de e-mail",
                  phone_input_placeholder: "Seu número de telefone",
                  token_input_placeholder: "Seu token OTP",
                  button_label: "Verificar token",
                  link_text: "Já tem um token OTP?",
                },
              },
            }}
          />
        </div>
      </div>
      <Footer /> {/* Renderiza o Footer aqui */}
    </div>
  );
};

export default Login;