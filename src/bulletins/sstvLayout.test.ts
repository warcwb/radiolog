import { entrada, estacao, min, op } from "../test/fabrica";
import { MODOS, montarBoletim } from "./sstvLayout";

const o = op();

test("tamanhos dos modos", () => {
  expect(MODOS.ROBOT36).toEqual({ largura: 320, altura: 240, linhas: 6, colunas: 24 });
  expect(MODOS.MARTIN1).toEqual({ largura: 320, altura: 256, linhas: 6, colunas: 24 });
  expect(MODOS.SCOTTIE1).toEqual({ largura: 320, altura: 256, linhas: 6, colunas: 24 });
  expect(MODOS.PD120).toEqual({ largura: 640, altura: 496, linhas: 12, colunas: 48 });
});

const ests = Array.from({ length: 14 }, (_, i) => estacao(`PU5A${String.fromCharCode(65 + i)}`));
const es = ests.map((e, i) => ({ ...entrada(o, e.chave, i), seq: i + 1 }));

test("equipes em ROBOT36 paginam em 3", () => {
  const p = montarBoletim(o, ests, es, "EQUIPES", "ROBOT36", min(30));
  expect(p).toHaveLength(3);
  expect(p[0]?.rodape).toBe("pág. 1/3");
  expect(p[0]?.cabecalho).toContain("PU5NOC");
  expect(p[0]?.cabecalho).toContain("REER-PR-2026-031");
  expect(p[0]?.cabecalho).toContain("14:30");
  p.forEach((pg) => {
    expect(pg.linhas.length).toBeLessThanOrEqual(6);
    pg.linhas.forEach((l) => expect([...l.texto].length).toBeLessThanOrEqual(24));
  });
});

test("PD120 cabe 12 linhas por página", () => {
  const p = montarBoletim(o, ests, es, "EQUIPES", "PD120", min(30));
  expect(p).toHaveLength(2);
  expect(p[0]?.linhas).toHaveLength(12);
});

test("situação marca emergência e oculta dado sensível", () => {
  const e2 = [
    { ...entrada(o, "PU5AA", 1, { tipo: "TRAFEGO", precedencia: "EMERGENCIA", texto: "Pedimos resgate na trilha 😱 já" }), seq: 1 },
    { ...entrada(o, "PU5AA", 2, { tipo: "TRAFEGO", precedencia: "PRIORIDADE", texto: "ferido leve" }), seq: 2 },
  ];
  const p = montarBoletim(o, [estacao("PU5AA", "CAMPO")], e2, "SITUACAO", "ROBOT36", min(5));
  const linhas = p.flatMap((x) => x.linhas);
  expect(linhas.some((l) => l.emergencia)).toBe(true);
  expect(linhas.map((l) => l.texto).join(" ")).toContain("[dado reservado]");
  expect(linhas.map((l) => l.texto).join(" ")).not.toContain("ferido");
  linhas.forEach((l) => {
    expect([...l.texto].length).toBeLessThanOrEqual(24);
    expect(l.texto).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

test("pendências e encerramento", () => {
  const alerta = montarBoletim(o, [estacao("PU5AA", "CAMPO")], [{ ...entrada(o, "PU5AA", 0), seq: 1 }], "PENDENCIAS", "ROBOT36", min(40));
  expect(alerta.flatMap((x) => x.linhas).map((l) => l.texto).join(" ")).toContain("PU5AA SEM CONTATO 40MIN");
  expect(montarBoletim(o, [], [], "PENDENCIAS", "ROBOT36", min(1))[0]?.linhas[0]?.texto).toBe("Sem pendências");
  const enc = { ...o, encerramento: { hora: min(120), totalEstacoes: 5, pendencias: [{ estacao: "PU5AA", texto: "confirmar" }], justificativa: "", responsavel: "PU5NOC", entregueA: "COSMO" } };
  const t = montarBoletim(enc, [], [], "ENCERRAMENTO", "ROBOT36", min(121)).flatMap((x) => x.linhas).map((l) => l.texto).join(" ");
  expect(t).toContain("Encerrada 16:00");
  expect(t).toContain("Estações: 5");
  expect(t).toContain("PU5AA confirmar");
});

test("palavra maior que a linha é cortada", () => {
  const p = montarBoletim(o, [estacao("PU5AA", "CAMPO", { local: "X".repeat(60) })], [{ ...entrada(o, "PU5AA", 0), seq: 1 }], "EQUIPES", "ROBOT36", min(1));
  p.flatMap((x) => x.linhas).forEach((l) => expect([...l.texto].length).toBeLessThanOrEqual(24));
});
