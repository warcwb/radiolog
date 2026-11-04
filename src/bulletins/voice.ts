import { situacaoEstacoes } from "../domain/stations";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";
import { RESERVADO, urgentes } from "./comum";
import { falarNumero, soletrar } from "./phonetic";

const SITUACAO = { ATIVA: "ativa", SAIDA: "encerrou", SEM_CONTATO: "sem contato" } as const;

export function roteiroVoz(op: Operacao, estacoes: Estacao[], entradas: Entrada[], agoraIso: string): string {
  const l = [`Aqui ${soletrar(op.estacaoLog.indicativo)}, boletim da operação ${falarNumero(op.numero)}, ${op.nome}. Hora ${formatarHora(agoraIso, op.fuso)}.`];
  for (const s of situacaoEstacoes(op, estacoes, entradas, agoraIso)) {
    const quem = s.estacao.indicativo ? soletrar(s.estacao.indicativo) : s.estacao.tatico;
    const quando = s.situacao === "SEM_CONTATO" ? ` há ${s.minutosSemContato} minutos` : s.ultimaHora ? `, último contato ${formatarHora(s.ultimaHora, op.fuso)}` : "";
    const onde = s.ultimoLocal ? `, local ${s.ultimoLocal}` : "";
    l.push(`${quem}: ${SITUACAO[s.situacao]}${quando}${onde}.`);
  }
  for (const e of urgentes(entradas)) {
    const texto = e.sensivel ? RESERVADO : e.texto;
    l.push(`${e.precedencia === "EMERGENCIA" ? "Emergência" : "Prioridade"} às ${formatarHora(e.hora, op.fuso)}: ${texto}.`);
  }
  l.push("Fim do boletim.");
  return l.join("\n");
}
