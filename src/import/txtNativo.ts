import type { Entrada, Estacao, Operacao } from "../domain/types";
import { CABECALHO_TXT } from "../export/txt";
import type { ImportPreview } from "./preview";

export const ehTxtNativo = (texto: string) => texto.replace(/^﻿/, "").split(/\r?\n/, 1)[0]?.trim() === CABECALHO_TXT;

const desescapar = (s: string) => s.replace(/\\(\\|n|\{)/g, (_, c: string) => (c === "n" ? "\n" : c));

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
    const barra = l.indexOf(" | ");
    const chave = l.lastIndexOf(" {");
    const dados = JSON.parse(l.slice(chave + 1)) as Omit<Entrada, "operacaoId" | "texto">;
    entradas.push({ ...dados, texto: desescapar(l.slice(barra + 3, chave)) } as Omit<Entrada, "operacaoId">);
    linhas.push({ numero: i + 1, original: l, status: "OK", avisos: [], entradaIndice: entradas.length - 1 });
  });
  linhas.unshift({ numero: 0, original: "Resumo da importação", status: "OK", avisos: [] });
  return { operacao, estacoes, entradas, linhas, pendenciasSugeridas: [] };
}
