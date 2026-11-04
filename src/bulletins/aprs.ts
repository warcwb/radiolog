import { situacaoEstacoes } from "../domain/stations";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";
import { numeroCurto } from "./comum";

export const APRS_MAX = 67;
const STATUS = { ATIVA: "OK", SAIDA: "QRT", SEM_CONTATO: "SEMCONTATO" } as const;

export function limparAprs(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
    .replace(/[^\x20-\x7e]|[|~{]/g, "").replace(/\s+/g, " ").trim();
}

const prefixo = (op: Operacao, chave: string) => `OP${numeroCurto(op.numero)} ${limparAprs(chave)} `;

export function aprsStatusEstacoes(op: Operacao, estacoes: Estacao[], entradas: Entrada[], agoraIso: string): string[] {
  return situacaoEstacoes(op, estacoes, entradas, agoraIso, { paraBoletim: true }).map((s) => {
    const hora = s.ultimaHora ? formatarHora(s.ultimaHora, op.fuso).replace(":", "") : "";
    return limparAprs(`${prefixo(op, s.estacao.chave)}${STATUS[s.situacao]} ${s.ultimoLocal} ${hora}`).slice(0, APRS_MAX);
  });
}

export function aprsTexto(op: Operacao, chave: string, texto: string): string[] {
  const p = prefixo(op, chave);
  const t = limparAprs(texto);
  if (p.length + t.length <= APRS_MAX) return [(p + t).trim()];
  for (let n = 2; ; n++) {
    const cabe = APRS_MAX - `${n}/${n} `.length - p.length;
    if (Math.ceil(t.length / cabe) <= n) {
      const total = Math.ceil(t.length / cabe);
      return Array.from({ length: total }, (_, i) => `${i + 1}/${total} ${p}${t.slice(i * cabe, (i + 1) * cabe)}`);
    }
  }
}
