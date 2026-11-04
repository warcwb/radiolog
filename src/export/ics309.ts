import { jsPDF } from "jspdf";
import { entradasCorrigidas } from "../domain/entries";
import { formatarHora } from "../domain/time";
import type { Entrada, Estacao, Operacao } from "../domain/types";
import { ROTULO_PRECEDENCIA, ROTULO_TIPO } from "./rotulos";

export const LINHAS_POR_PAGINA = 32;

const M = 10; // margem (mm)
const COLS = [24, 30, 30] as const; // Hora | De | Para | Mensagem (resto)
const ALTURA_LINHA = 6;
const Y_TABELA = 52;

function mensagem(e: Entrada, corrigidaPor: number | undefined): string {
  const partes = [`${ROTULO_TIPO[e.tipo]}:`];
  if (e.precedencia !== "ROTINA") partes.push(ROTULO_PRECEDENCIA[e.precedencia]);
  if (e.teste) partes.push("TESTE");
  if (e.numMensagem) partes.push(`Nº ${e.numMensagem}`);
  if (e.corrige !== undefined) partes.push(`(corrige #${e.corrige})`);
  if (e.qsa !== undefined || e.qrk !== undefined) partes.push(`${e.qsa ?? "-"}/${e.qrk ?? "-"}`);
  if (e.local) partes.push(`@${e.local}`);
  if (e.texto) partes.push(e.texto);
  if (corrigidaPor !== undefined) partes.push(`[corrigida por #${corrigidaPor}]`);
  return partes.join(" ");
}

export function gerarIcs309(op: Operacao, _estacoes: Estacao[], entradas: Entrada[]): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: false });
  const largura = doc.internal.pageSize.getWidth();
  const larguraMsg = largura - 2 * M - COLS[0] - COLS[1] - COLS[2];
  const corrigidas = entradasCorrigidas(entradas);
  doc.setFont("helvetica", "normal").setFontSize(8);

  // Monta as linhas físicas primeiro para saber o total de páginas.
  const fisicas: [string, string, string, string][] = [];
  for (const e of entradas) {
    const msg = doc.splitTextToSize(mensagem(e, corrigidas.get(e.seq)), larguraMsg - 2) as string[];
    const hora = e.horaDesconhecida ? "--:--" : formatarHora(e.hora, op.fuso);
    msg.forEach((t, i) => fisicas.push(i === 0 ? [`${hora} #${e.seq}`, e.de, e.para, t] : ["", "", "", t]));
  }
  const paginas = Math.max(1, Math.ceil(fisicas.length / LINHAS_POR_PAGINA));

  for (let p = 0; p < paginas; p++) {
    if (p > 0) doc.addPage();
    doc.setFont("helvetica", "bold").setFontSize(13).text("REGISTRO DE COMUNICAÇÕES (ICS 309)", M, 14);
    doc.setFont("helvetica", "normal").setFontSize(9);
    const periodo = `${op.data} ${formatarHora(op.inicio, op.fuso)}${op.fim ? ` a ${formatarHora(op.fim, op.fuso)}` : ""}`;
    doc.text([
      `Incidente: ${op.nome}  ·  Nº ${op.numero}  ·  Tipo: ${op.tipo}`,
      `Período: ${periodo} (fuso ${op.fuso})  ·  Rede: ${op.rede}`,
      `Frequência: ${op.frequencia}${op.repetidora ? `  ·  Repetidora: ${op.repetidora}` : ""}${op.tom ? `  ·  Tom: ${op.tom}` : ""}  ·  Modo: ${op.modo}`,
      `Operador: ${op.estacaoLog.indicativo}${op.ncs.indicativo ? `  ·  NCS: ${op.ncs.indicativo}` : ""}  ·  Órgão apoiado: ${op.orgaoApoiado}`,
    ], M, 22);
    let x = M;
    const y0 = Y_TABELA - 2;
    doc.setFont("helvetica", "bold");
    (["Hora", "De", "Para", "Mensagem"] as const).forEach((h, i) => {
      doc.text(h, x + 1, y0);
      x += COLS[i as 0 | 1 | 2] ?? 0;
    });
    doc.line(M, y0 + 1.5, largura - M, y0 + 1.5);
    doc.setFont("helvetica", "normal").setFontSize(8);
    fisicas.slice(p * LINHAS_POR_PAGINA, (p + 1) * LINHAS_POR_PAGINA).forEach((cols, i) => {
      const y = Y_TABELA + 4 + i * ALTURA_LINHA;
      doc.text(cols[0], M + 1, y);
      doc.text(cols[1], M + COLS[0] + 1, y);
      doc.text(cols[2], M + COLS[0] + COLS[1] + 1, y);
      doc.text(cols[3], M + COLS[0] + COLS[1] + COLS[2] + 1, y);
    });
    const yRodape = Y_TABELA + 6 + LINHAS_POR_PAGINA * ALTURA_LINHA;
    doc.line(M, yRodape - 2, largura - M, yRodape - 2);
    doc.setFontSize(9);
    const enc = op.encerramento;
    const rodape = enc
      ? [`Encerramento: ${formatarHora(enc.hora, op.fuso)}  ·  Total de estações: ${enc.totalEstacoes}${enc.pendencias.length ? `  ·  Pendências: ${enc.pendencias.map((x) => `${x.estacao} ${x.texto}`.trim()).join("; ")}` : ""}`,
        `Responsável: ${enc.responsavel}  ·  Entregue a: ${enc.entregueA}`]
      : ["Responsável: ______________________"];
    doc.text([...rodape, "Assinatura: ______________________"], M, yRodape + 3);
    doc.text(`Página ${p + 1} de ${paginas}`, largura - M, yRodape + 3, { align: "right" });
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
