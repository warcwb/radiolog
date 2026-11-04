import { alertasSemContato } from "../domain/alerts";
import { ehDeCampo, situacaoEstacoes } from "../domain/stations";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";
import { pendenciaNoAr, textoNoAr, urgentes } from "./comum";

export type ModoSstv = "ROBOT36" | "MARTIN1" | "SCOTTIE1" | "PD120";
export const MODOS: Record<ModoSstv, { largura: number; altura: number; linhas: number; colunas: number }> = {
  ROBOT36: { largura: 320, altura: 240, linhas: 6, colunas: 24 },
  MARTIN1: { largura: 320, altura: 256, linhas: 6, colunas: 24 },
  SCOTTIE1: { largura: 320, altura: 256, linhas: 6, colunas: 24 },
  PD120: { largura: 640, altura: 496, linhas: 12, colunas: 48 },
};

export type ModeloBoletim = "SITUACAO" | "EQUIPES" | "PENDENCIAS" | "ENCERRAMENTO";
export interface LinhaSstv { texto: string; emergencia: boolean }
export interface PaginaSstv { cabecalho: string; rodape: string; linhas: LinhaSstv[] }

const SIT = { ATIVA: "OK", SAIDA: "SAIU", SEM_CONTATO: "S/CONTATO" } as const;
const semEmoji = (s: string) => s.replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/\s+/g, " ").trim();

/** Quebra por palavra (contando caracteres, não bytes); palavra maior que a linha é cortada. */
export function quebrar(texto: string, colunas: number): string[] {
  const out: string[] = [];
  let atual: string[] = [];
  for (const palavra of semEmoji(texto).split(" ").filter(Boolean)) {
    let p = [...palavra];
    while (p.length > colunas) {
      if (atual.length) { out.push(atual.join("")); atual = []; }
      out.push(p.slice(0, colunas).join(""));
      p = p.slice(colunas);
    }
    const tentativa = atual.length ? [...atual, " ", ...p] : p;
    if (tentativa.length > colunas) { out.push(atual.join("")); atual = p; } else atual = tentativa;
  }
  if (atual.length) out.push(atual.join(""));
  return out;
}

function conteudo(op: Operacao, estacoes: Estacao[], entradas: Entrada[], modelo: ModeloBoletim, agoraIso: string): LinhaSstv[] {
  const item = (texto: string, emergencia = false) => ({ texto, emergencia });
  const sit = situacaoEstacoes(op, estacoes, entradas, agoraIso, { paraBoletim: true });
  switch (modelo) {
    case "SITUACAO":
      return [
        item(`Ativas: ${sit.filter((s) => s.situacao === "ATIVA").length}`),
        item(`Em campo: ${sit.filter((s) => ehDeCampo(s.estacao) && s.situacao !== "SAIDA").length}`),
        item(`Sem contato: ${sit.filter((s) => s.situacao === "SEM_CONTATO").length}`),
        ...urgentes(entradas).map((e) => item(`${formatarHora(e.hora, op.fuso)} ${e.de}: ${textoNoAr(e)}`, e.precedencia === "EMERGENCIA")),
      ];
    case "EQUIPES":
      return sit.map((s) => item(`${s.estacao.chave} ${SIT[s.situacao]} ${s.ultimaHora ? formatarHora(s.ultimaHora, op.fuso) : ""} ${s.ultimoLocal}`, s.situacao === "SEM_CONTATO"));
    case "PENDENCIAS": {
      const l = [
        ...alertasSemContato(op, estacoes, entradas, agoraIso).map((a) => item(`${a.chave} SEM CONTATO ${a.minutos}MIN`, true)),
        ...(op.encerramento?.pendencias ?? []).map((p) => item(pendenciaNoAr(p))),
      ];
      return l.length ? l : [item("Sem pendências")];
    }
    case "ENCERRAMENTO": {
      const enc = op.encerramento;
      if (!enc) return [item("Operação em andamento")];
      return [item(`Encerrada ${formatarHora(enc.hora, op.fuso)}`), item(`Estações: ${enc.totalEstacoes}`), ...enc.pendencias.map((p) => item(pendenciaNoAr(p), true))];
    }
  }
}

export function montarBoletim(op: Operacao, estacoes: Estacao[], entradas: Entrada[], modelo: ModeloBoletim, modo: ModoSstv, agoraIso: string): PaginaSstv[] {
  const { linhas, colunas } = MODOS[modo];
  const fisicas = conteudo(op, estacoes, entradas, modelo, agoraIso)
    .flatMap((l) => quebrar(l.texto, colunas).map((texto) => ({ texto, emergencia: l.emergencia })));
  const total = Math.max(1, Math.ceil(fisicas.length / linhas));
  const cabecalho = `${op.estacaoLog.indicativo} ${op.numero} ${formatarHora(agoraIso, op.fuso)}`;
  return Array.from({ length: total }, (_, i) => ({ cabecalho, rodape: `pág. ${i + 1}/${total}`, linhas: fisicas.slice(i * linhas, (i + 1) * linhas) }));
}
