import { entradasCorrigidas } from "../domain/entries";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";

export const CABECALHO_TXT = "RADIOLOG TXT v1";

/** Escapa o texto livre para caber numa linha: \ → \\, quebra → \n, { → \{ */
export const escaparTexto = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\{/g, "\\{");

export function exportarTxt(op: Operacao, estacoes: Estacao[], entradas: Entrada[]): string {
  const corrigidas = entradasCorrigidas(entradas);
  const l: string[] = [
    CABECALHO_TXT,
    `# operacao: ${JSON.stringify(op)}`,
    ...estacoes.map((e) => `# estacao: ${JSON.stringify(e)}`),
    `# ${op.numero} · ${op.nome} · ${op.frequencia}${op.repetidora ? ` via ${op.repetidora}` : ""} · fuso ${op.fuso}`,
    "== REGISTROS ==",
  ];
  for (const e of entradas) {
    const { operacaoId: _o, texto, ...dados } = e;
    const sinal = e.qsa !== undefined || e.qrk !== undefined ? ` ${e.qsa ?? "-"}/${e.qrk ?? "-"}` : "";
    const local = e.local ? ` @${e.local}` : "";
    const corr = corrigidas.has(e.seq) ? ` (corrigida por #${corrigidas.get(e.seq)})` : "";
    const hora = e.horaDesconhecida ? "--:--" : formatarHora(e.hora, op.fuso);
    l.push(`${hora} #${e.seq} ${e.tipo} [${e.precedencia}] ${e.de}→${e.para}${sinal}${local}${corr} | ${escaparTexto(texto)} ${JSON.stringify(dados)}`);
  }
  if (op.encerramento) {
    const enc = op.encerramento;
    l.push("== ENCERRAMENTO ==",
      `Hora: ${formatarHora(enc.hora, op.fuso)} · Total de estações: ${enc.totalEstacoes}`,
      ...enc.pendencias.map((p) => `Pendência: ${p.estacao} ${p.texto}`.trim()),
      ...(enc.justificativa ? [`Justificativa: ${enc.justificativa}`] : []),
      `Responsável: ${enc.responsavel} · Entregue a: ${enc.entregueA}`);
  }
  return l.join("\n") + "\n";
}
