import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";

const COLUNAS = ["seq", "hora", "tipo", "de", "para", "qsa", "qrk", "local", "grid", "precedencia", "teste", "numMensagem", "texto", "sensivel", "corrige", "operador", "origem"] as const;

const celula = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const simNao = (b: boolean) => (b ? "sim" : "não");

export function exportarCsv(op: Operacao, _estacoes: Estacao[], entradas: Entrada[]): string {
  const linhas = entradas.map((e) => {
    const v: Record<(typeof COLUNAS)[number], string> = {
      seq: String(e.seq), hora: e.horaDesconhecida ? "" : formatarHora(e.hora, op.fuso), tipo: e.tipo, de: e.de, para: e.para,
      qsa: e.qsa?.toString() ?? "", qrk: e.qrk?.toString() ?? "", local: e.local, grid: e.grid, precedencia: e.precedencia,
      teste: simNao(e.teste), numMensagem: e.numMensagem, texto: e.texto, sensivel: simNao(e.sensivel),
      corrige: e.corrige?.toString() ?? "", operador: e.operador, origem: e.origem,
    };
    return COLUNAS.map((c) => celula(v[c])).join(";");
  });
  return "﻿" + [COLUNAS.join(";"), ...linhas].join("\r\n") + "\r\n";
}
