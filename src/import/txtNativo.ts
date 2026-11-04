import type { Entrada, Estacao, Operacao } from "../domain/types";
import { CABECALHO_TXT } from "../export/txt";
import type { ImportPreview } from "./preview";

export const ehTxtNativo = (texto: string) => texto.replace(/^﻿/, "").split(/\r?\n/, 1)[0]?.trim() === CABECALHO_TXT;

export function interpretarTxtNativo(texto: string): ImportPreview {
  if (!ehTxtNativo(texto)) throw new Error("Não é um TXT do RadioLog");
  let operacao: Partial<Operacao> = {};
  const estacoes: Estacao[] = [];
  const entradas: Omit<Entrada, "operacaoId">[] = [];
  const linhas: ImportPreview["linhas"] = [];
  let secao = "";
  texto.split(/\r?\n/).forEach((l, i) => {
    if (l.startsWith("== ")) { secao = l; return; }
    if (l.startsWith("# operacao: ")) { operacao = JSON.parse(l.slice(12)) as Operacao; return; }
    if (l.startsWith("# estacao: ")) { estacoes.push(JSON.parse(l.slice(11)) as Estacao); return; }
    if (secao !== "== REGISTROS ==" || !l.trim()) return;
    const tab = l.indexOf("\t");
    if (tab < 0) throw new Error(`Linha ${i + 1} sem dados do RadioLog`);
    entradas.push(JSON.parse(l.slice(tab + 1)) as Omit<Entrada, "operacaoId">);
    linhas.push({ numero: i + 1, original: l, status: "OK", avisos: [], entradaIndice: entradas.length - 1 });
  });
  linhas.unshift({ numero: 0, original: "Resumo da importação", status: "OK", avisos: [] });
  return { operacao, estacoes, entradas, linhas, pendenciasSugeridas: [] };
}
