import { entrada, estacao, op } from "../test/fabrica";
import { validarEncerramento } from "./closing";

const o = op();
const ests = [estacao("PU5ONI", "CAMPO"), estacao("PY5CSM"), estacao("PY5NUNCA")];
const es = [entrada(o, "PU5ONI", 0), entrada(o, "PY5CSM", 1), entrada(o, "PY5CSM", 2)];

test("bloqueia com equipe de campo sem saída", () => {
  expect(validarEncerramento(o, ests, es, "")).toEqual({ ok: false, camposSemSaida: ["PU5ONI"], totalEstacoes: 2 });
  expect(validarEncerramento(o, ests, es, "   ").ok).toBe(false);
});

test("justificativa libera", () => {
  expect(validarEncerramento(o, ests, es, "Equipe confirmou por telefone").ok).toBe(true);
});

test("com saída registrada está ok", () => {
  expect(validarEncerramento(o, ests, [...es, entrada(o, "PU5ONI", 5, { tipo: "SAIDA" })], "").ok).toBe(true);
});
