import { situacaoEstacoes } from "./stations";
import type { Entrada, Estacao, Operacao } from "./types";

export interface Alerta { chave: string; minutos: number }

export function alertasSemContato(op: Operacao, estacoes: Estacao[], entradas: Entrada[], agoraIso: string): Alerta[] {
  return situacaoEstacoes(op, estacoes, entradas, agoraIso)
    .filter((s) => s.situacao === "SEM_CONTATO")
    .map((s) => ({ chave: s.estacao.chave, minutos: s.minutosSemContato ?? 0 }));
}

/** Minutos desde a última identificação, quando passou do lembrete configurado; senão null. */
export function lembreteIdentificacao(op: Operacao, entradas: Entrada[], agoraIso: string): number | null {
  if (op.lembreteIdentMin === null) return null;
  const idents = entradas.filter((e) => e.tipo === "IDENTIFICACAO").map((e) => e.hora).sort();
  const desde = idents[idents.length - 1] ?? op.inicio;
  const minutos = Math.floor((new Date(agoraIso).getTime() - new Date(desde).getTime()) / 60000);
  return minutos > op.lembreteIdentMin ? minutos : null;
}
