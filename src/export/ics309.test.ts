import { novaCorrecao } from "../domain/entries";
import { entrada, op, T0 } from "../test/fabrica";
import { gerarIcs309, LINHAS_POR_PAGINA } from "./ics309";

const textoPdf = (b: Uint8Array) => new TextDecoder("latin1").decode(b).replace(/\\([()\\])/g, "$1");

test("cabeçalho, página única e rodapé", () => {
  const o = op();
  const t = textoPdf(gerarIcs309(o, [], [{ ...entrada(o, "PU5ONI", 0, { texto: "Descendo" }), seq: 1 }]));
  expect(t.startsWith("%PDF")).toBe(true);
  for (const s of ["REGISTRO DE COMUNICAÇÕES (ICS 309)", "Travessia", "REER-PR-2026-031", "145.210 MHz", "Página 1 de 1", "Responsável:", "Assinatura:", "Descendo", "PU5ONI"])
    expect(t).toContain(s);
});

test("pagina a cada 32 linhas", () => {
  expect(LINHAS_POR_PAGINA).toBe(32);
  const o = op();
  const es = Array.from({ length: 70 }, (_, i) => ({ ...entrada(o, "PU5ONI", i), seq: i + 1 }));
  const t = textoPdf(gerarIcs309(o, [], es));
  expect(t).toContain("Página 3 de 3");
  expect(t).not.toContain("Página 4 de");
});

test("marca correções e precedência", () => {
  const o = op();
  const e1 = { ...entrada(o, "PU5ONI", 0, { texto: "QRK 4" }), seq: 1 };
  const e2 = { ...entrada(o, "PU5ONI", 1, { tipo: "MENSAGEM_FORMAL", precedencia: "EMERGENCIA", numMensagem: "007", texto: "Socorro" }), seq: 2 };
  const t = textoPdf(gerarIcs309(o, [], [e1, e2, novaCorrecao(o, 3, e1, "QRK era 3", "PU5NOC", T0)]));
  expect(t).toContain("[corrigida por #3]");
  expect(t).toContain("QRK era 3");
  expect(t).toContain("EMERGÊNCIA");
  expect(t).toContain("Nº 007");
});

test("encerramento aparece no rodapé", () => {
  const o = { ...op(), encerramento: { hora: T0, totalEstacoes: 4, pendencias: [], justificativa: "", responsavel: "PU5NOC", entregueA: "COSMO" } };
  expect(textoPdf(gerarIcs309(o, [], []))).toContain("Entregue a: COSMO");
});
