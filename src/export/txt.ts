import { entradasCorrigidas } from "../domain/entries";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";

export const CABECALHO_TXT = "RADIOLOG TXT v1";

/** Parte legível numa linha só (sem tabulação nem quebra). */
const legivel = (s: string) => s.replace(/[\t\r\n]+/g, " ");

/**
 * Cada registro é "parte legível <TAB> JSON". O JSON guarda a entrada inteira (inclusive o texto),
 * e o JSON.stringify nunca produz uma tabulação crua — por isso a primeira TAB separa com segurança.
 */
export function exportarTxt(op: Operacao, estacoes: Estacao[], entradas: Entrada[]): string {
  const corrigidas = entradasCorrigidas(entradas);
  const l: string[] = [
    CABECALHO_TXT,
    `# operacao: ${JSON.stringify(op)}`,
    ...estacoes.map((e) => `# estacao: ${JSON.stringify(e)}`),
    legivel(`# ${op.numero} · ${op.nome} · ${op.frequencia}${op.repetidora ? ` via ${op.repetidora}` : ""} · fuso ${op.fuso}`),
    "== REGISTROS ==",
  ];
  for (const e of entradas) {
    const { operacaoId: _o, ...dados } = e;
    const sinal = e.qsa !== undefined || e.qrk !== undefined ? ` ${e.qsa ?? "-"}/${e.qrk ?? "-"}` : "";
    const local = e.local ? ` @${e.local}` : "";
    const corr = corrigidas.has(e.seq) ? ` (corrigida por #${corrigidas.get(e.seq)})` : "";
    const hora = e.horaDesconhecida ? "--:--" : formatarHora(e.hora, op.fuso);
    l.push(`${legivel(`${hora} #${e.seq} ${e.tipo} [${e.precedencia}] ${e.de}→${e.para}${sinal}${local}${corr} | ${e.texto}`)}\t${JSON.stringify(dados)}`);
  }
  if (op.encerramento) {
    const enc = op.encerramento;
    l.push("== ENCERRAMENTO ==",
      `Hora: ${formatarHora(enc.hora, op.fuso)} · Total de estações: ${enc.totalEstacoes}`,
      ...enc.pendencias.map((p) => legivel(`Pendência: ${p.estacao} ${p.texto}`.trim())),
      ...(enc.justificativa ? [legivel(`Justificativa: ${enc.justificativa}`)] : []),
      legivel(`Responsável: ${enc.responsavel} · Entregue a: ${enc.entregueA}`));
  }
  return l.join("\n") + "\n";
}
