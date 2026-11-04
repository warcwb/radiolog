import { ehTxtNativo, interpretarTxtNativo } from "../import/txtNativo";
import { entrada, estacao, op, T0 } from "../test/fabrica";
import { novaCorrecao } from "../domain/entries";
import { exportarTxt } from "./txt";

function cenario() {
  const o = { ...op(), encerramento: { hora: T0, totalEstacoes: 2, pendencias: [{ estacao: "PU5ONI", texto: "confirmar" }], justificativa: "ok", responsavel: "PU5NOC", entregueA: "COSMO" } };
  const ests = [estacao("PU5ONI", "CAMPO", { nome: "Edilson", local: "Trilha" }), estacao("EQUIPE 1", "MOVEL", { indicativo: "", tatico: "Equipe 1" })];
  const e1 = entrada(o, "PU5ONI", 0, { qsa: 5, qrk: 3, local: "Trilha km 2", texto: "Deslocamento BaseCOSMO→Prainha | {chave} \\ fim\nsegunda linha" });
  const es = [
    { ...e1, seq: 1 },
    { ...entrada(o, "EQUIPE 1", 1, { tipo: "MENSAGEM_FORMAL", precedencia: "EMERGENCIA", numMensagem: "001", texto: "vítima no km 3", grid: "GG54jm" }), seq: 2 },
    { ...entrada(o, "", 2, { tipo: "OBSERVACAO", horaDesconhecida: true, origem: "IMPORTADO", texto: "" }), seq: 3 },
    { ...entrada(o, "PU5???", 3, { tipo: "NAO_IDENTIFICADA", qrk: 2, texto: "fraco" }), seq: 4 },
    novaCorrecao(o, 5, { ...e1, seq: 1 }, "QRK era 4 (corrigida por #9)", "PU5NOC", T0),
  ];
  return { o, ests, es };
}

test("TXT nativo vai e volta sem perda", () => {
  const { o, ests, es } = cenario();
  const txt = exportarTxt(o, ests, es);
  expect(ehTxtNativo(txt)).toBe(true);
  const p = interpretarTxtNativo(txt);
  expect(p.operacao).toEqual(o);
  expect(p.estacoes).toEqual(ests);
  expect(p.entradas).toEqual(es.map(({ operacaoId: _, ...resto }) => resto));
  expect(p.linhas).toHaveLength(es.length + 1);
});

test("TXT é legível e marca a entrada corrigida", () => {
  const { o, ests, es } = cenario();
  const txt = exportarTxt(o, ests, es);
  expect(txt.split("\n")[0]).toBe("RADIOLOG TXT v1");
  expect(txt).toContain("14:00 #1 SITUACAO [ROTINA] PU5ONI→PU5NOC 5/3 @Trilha km 2 (corrigida por #5) | ");
  expect(txt).toContain("== ENCERRAMENTO ==");
  expect(txt).toContain("Entregue a: COSMO");
});

test("detecta só o TXT nativo", () => {
  expect(ehTxtNativo("LOG QRG145.210MHz")).toBe(false);
  expect(() => interpretarTxtNativo("LOG QRG")).toThrow("Não é um TXT do RadioLog");
});

test("campos com | { e tabulação também voltam sem perda", () => {
  const o = op();
  const es = [{ ...entrada(o, "Equipe {1}", 0, { local: "Rua A | B", texto: "chegou {ok}\tfim", numMensagem: "N {2}" }), seq: 1 }, { ...entrada(o, "PU5ONI", 1, { local: "Ponto {A}" }), seq: 2 }];
  const p = interpretarTxtNativo(exportarTxt(o, [], es));
  expect(p.entradas).toEqual(es.map(({ operacaoId: _, ...r }) => r));
});
