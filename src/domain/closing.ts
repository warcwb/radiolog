import { contaComoOuvida, ehDeCampo, situacaoEstacoes } from "./stations";
import type { Entrada, Estacao, Operacao } from "./types";

export interface ResultadoEncerramento { ok: boolean; camposSemSaida: string[]; totalEstacoes: number }

export function validarEncerramento(op: Operacao, estacoes: Estacao[], entradas: Entrada[], justificativa: string): ResultadoEncerramento {
  const camposSemSaida = situacaoEstacoes(op, estacoes, entradas, new Date().toISOString())
    .filter((s) => ehDeCampo(s.estacao) && s.situacao !== "SAIDA")
    .map((s) => s.estacao.chave);
  const chaves = new Set(estacoes.map((e) => e.chave));
  const totalEstacoes = new Set(entradas.filter((e) => contaComoOuvida(e) && chaves.has(e.de)).map((e) => e.de)).size;
  return { ok: camposSemSaida.length === 0 || justificativa.trim() !== "", camposSemSaida, totalEstacoes };
}
