import { novaEntrada } from "../domain/entries";
import { novaOperacao } from "../domain/operation";
import type { Entrada, Estacao, Funcao, NovaEntradaInput, Operacao } from "../domain/types";

export const T0 = "2026-10-31T17:00:00.000Z"; // 14:00 local
export const min = (m: number, base = T0) => new Date(new Date(base).getTime() + m * 60000).toISOString();

export function op(dados: Partial<Operacao> = {}): Operacao {
  return novaOperacao({ nome: "Travessia", numero: "REER-PR-2026-031", frequencia: "145.210 MHz", estacaoLog: { indicativo: "PU5NOC", equipamento: "FTM-100D", potencia: "20W", antena: "", grid: "GG54jm" }, ...dados }, T0, dados.id ?? "op1");
}

export function estacao(chave: string, funcao: Funcao = "FIXA", extra: Partial<Estacao> = {}): Estacao {
  return { operacaoId: "op1", chave, indicativo: chave, tatico: "", nome: "", equipamento: "", local: "", grid: "", funcao, ...extra };
}

let seq = 0;
export function entrada(o: Operacao, de: string, minutos: number, extra: Partial<NovaEntradaInput> = {}): Entrada {
  seq++;
  return novaEntrada(o, seq, { hora: min(minutos), operador: "PU5NOC", tipo: "SITUACAO", de, texto: "", ...extra }, min(minutos));
}
