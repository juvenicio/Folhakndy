import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para normalizar strings, removendo acentos e convertendo para minúsculas e removendo espaços extras
export function normalizeString(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return "";
  }
  return str
    .normalize("NFD") // Normaliza para forma de decomposição (separa acentos)
    .replace(/[\u0300-\u036f]/g, "") // Remove os caracteres diacríticos (acentos)
    .toLowerCase() // Converte para minúsculas
    .trim(); // Remove espaços em branco do início e fim
}