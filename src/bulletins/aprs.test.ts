import { entrada, estacao, min, op } from "../test/fabrica";
import { APRS_MAX, aprsStatusEstacoes, aprsTexto, limparAprs } from "./aprs";

test("limpa acentos, emoji e caracteres proibidos", () => {
  expect(limparAprs("Situação ok 🚑")).toBe("SITUACAO OK");
  expect(limparAprs("a|b~c{d}  e")).toBe("ABCD} E");
});

test("status das estações em mensagens curtas", () => {
  const o = op();
  const ests = [estacao("PU5ONI", "CAMPO"), estacao("PY5CSM"), estacao("PU5VAZ", "MOVEL", { local: "Tatuquara" })];
  const es = [
    { ...entrada(o, "PU5ONI", 105, { tipo: "SAIDA", local: "Prainha" }), seq: 1 },
    { ...entrada(o, "PY5CSM", 100), seq: 2 },
    { ...entrada(o, "PU5VAZ", 0), seq: 3 },
  ];
  const r = aprsStatusEstacoes(o, ests, es, min(110));
  expect(r).toContain("OP031 PU5ONI QRT PRAINHA 1545");
  expect(r).toContain("OP031 PY5CSM OK 1540");
  expect(r).toContain("OP031 PU5VAZ SEMCONTATO TATUQUARA 1400");
  r.forEach((m) => expect(m.length).toBeLessThanOrEqual(APRS_MAX));
});

test("texto longo é dividido em partes numeradas", () => {
  const partes = aprsTexto(op(), "PU5ONI", "A".repeat(150));
  expect(partes.map((p) => p.slice(0, 4))).toEqual(["1/3 ", "2/3 ", "3/3 "]);
  partes.forEach((p) => expect(p.length).toBeLessThanOrEqual(APRS_MAX));
  expect(partes.map((p) => p.replace(/^\d\/\d OP031 PU5ONI /, "")).join("")).toBe("A".repeat(150));
  expect(aprsTexto(op(), "PU5ONI", "ok tudo bem")).toEqual(["OP031 PU5ONI OK TUDO BEM"]);
});
