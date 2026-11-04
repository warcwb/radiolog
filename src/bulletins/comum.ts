import type { Entrada } from "../domain/types";

export const RESERVADO = "dado reservado";

/** Texto da entrada para boletins de rádio: dados sensíveis nunca saem no ar. */
export const textoNoAr = (e: Entrada) => (e.sensivel ? `[${RESERVADO}]` : e.texto);

export const numeroCurto = (numero: string) => /(\d+)$/.exec(numero)?.[1] ?? "";

export const urgentes = (entradas: Entrada[]) =>
  entradas.filter((e) => e.precedencia === "EMERGENCIA" || e.precedencia === "PRIORIDADE");
