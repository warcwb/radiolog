import { entrada, estacao, min, op } from "../test/fabrica";
import { situacaoEstacoes } from "./stations";

const o = op();

test("estação de campo sem ser ouvida além do limite fica SEM_CONTATO", () => {
  const r = situacaoEstacoes(o, [estacao("PU5ONI", "CAMPO")], [entrada(o, "PU5ONI", 0, { local: "Trilha" })], min(31));
  expect(r[0]).toMatchObject({ situacao: "SEM_CONTATO", minutosSemContato: 31, ultimoLocal: "Trilha" });
});

test("saída registrada vence o tempo sem contato", () => {
  const es = [entrada(o, "PU5ONI", 0), entrada(o, "PU5ONI", 5, { tipo: "SAIDA" })];
  expect(situacaoEstacoes(o, [estacao("PU5ONI", "CAMPO")], es, min(120))[0]?.situacao).toBe("SAIDA");
});

test("estação fixa nunca fica sem contato", () => {
  const r = situacaoEstacoes(o, [estacao("PY5CSM", "FIXA")], [entrada(o, "PY5CSM", 0, { qsa: 5, qrk: 4 })], min(120));
  expect(r[0]).toMatchObject({ situacao: "ATIVA", ultimoQsa: 5, ultimoQrk: 4 });
});

test("correção, observação e troca de operador não contam como ouvida", () => {
  const es = [entrada(o, "PU5ONI", 0), entrada(o, "PU5ONI", 20, { tipo: "OBSERVACAO" }), entrada(o, "PU5ONI", 25, { tipo: "CORRECAO", corrige: 1 }), entrada(o, "PU5ONI", 26, { tipo: "TROCA_OPERADOR" })];
  expect(situacaoEstacoes(o, [estacao("PU5ONI", "MOVEL")], es, min(31))[0]?.minutosSemContato).toBe(31);
});

test("campo e móvel primeiro, por tempo sem contato; depois as demais por chave", () => {
  const ests = [estacao("PY5ZZZ"), estacao("PU5AAA", "CAMPO"), estacao("PU5BBB", "MOVEL"), estacao("PY5AAA")];
  const es = [entrada(o, "PU5AAA", 10), entrada(o, "PU5BBB", 0), entrada(o, "PY5ZZZ", 0), entrada(o, "PY5AAA", 0)];
  expect(situacaoEstacoes(o, ests, es, min(15)).map((s) => s.estacao.chave)).toEqual(["PU5BBB", "PU5AAA", "PY5AAA", "PY5ZZZ"]);
});

test("estação sem entradas usa o local do cadastro", () => {
  expect(situacaoEstacoes(o, [estacao("PU5X", "CAMPO", { local: "Base" })], [], min(5))[0]).toMatchObject({ situacao: "ATIVA", ultimoLocal: "Base" });
});
