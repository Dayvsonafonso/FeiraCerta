import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function calculateVariation(current: number, previous: number) {
  const diff = current - previous;
  const percent = previous !== 0 ? (diff / previous) * 100 : 0;
  return { diff, percent };
}
