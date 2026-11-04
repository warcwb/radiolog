import type { Entrada, Estacao, Operacao } from "../domain/types";
import { importarLote } from "../store/repo";

export type StatusLinha = "OK" | "AVISO" | "NAO_RECONHECIDA";
export type CodigoAviso =
  | "SEMELHANTE" | "SEM_SAIDA" | "AMBIGUO_SEGURANCA" | "FORA_PERIODO" | "HORA_RETROCEDE"
  | "NAO_IDENTIFICADA" | "ESTRANGEIRO" | "SEM_HORA";

export interface Aviso { codigo: CodigoAviso; texto: string }
export interface LinhaPreview { numero: number; original: string; status: StatusLinha; avisos: Aviso[]; entradaIndice?: number }

/** linhas: uma por entrada gerada (numero = nº da linha no arquivo) + a linha 0 de resumo. */
export interface ImportPreview {
  operacao: Partial<Operacao>;
  estacoes: Estacao[];
  entradas: Omit<Entrada, "operacaoId">[];
  linhas: LinhaPreview[];
  pendenciasSugeridas: { estacao: string; texto: string }[];
}

export async function aplicarImportacao(p: ImportPreview, base: Operacao): Promise<Operacao> {
  const op: Operacao = { ...base, ...p.operacao, id: base.id };
  const entradas: Entrada[] = p.entradas.map((e) => ({ ...e, operacaoId: op.id }));
  await importarLote(op, p.estacoes.map((e) => ({ ...e, operacaoId: op.id })), entradas);
  return op;
}
