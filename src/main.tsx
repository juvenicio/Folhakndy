import React from "react"; // Importar React para usar StrictMode
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "next-themes";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode> {/* Envolver o aplicativo com React.StrictMode */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);