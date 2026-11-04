import { entrada, estacao, min, op } from "../test/fabrica";
import { alertasSemContato, lembreteIdentificacao } from "./alerts";

const o = op();
const ests = [estacao("PU5ONI", "MOVEL")];

test("alerta só depois do limite", () => {
  const es = [entrada(o, "PU5ONI", 0)];
  expect(alertasSemContato(o, ests, es, min(29))).toEqual([]);
  expect(alertasSemContato(o, ests, es, min(31))).toEqual([{ chave: "PU5ONI", minutos: 31 }]);
});

test("nova entrada remove o alerta", () => {
  expect(alertasSemContato(o, ests, [entrada(o, "PU5ONI", 0), entrada(o, "PU5ONI", 30)], min(31))).toEqual([]);
});

test("lembrete de identificação", () => {
  expect(lembreteIdentificacao(o, [], min(60))).toBeNull();
  const comLembrete = { ...o, lembreteIdentMin: 10 };
  const es = [entrada(comLembrete, "PU5NOC", 0, { tipo: "IDENTIFICACAO" })];
  expect(lembreteIdentificacao(comLembrete, es, min(9))).toBeNull();
  expect(lembreteIdentificacao(comLembrete, es, min(11))).toBe(11);
  expect(lembreteIdentificacao(comLembrete, [], min(12))).toBe(12);
});
