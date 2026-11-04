import { indicativoEstrangeiro, indicativoValido, normalizarIndicativo, semelhantes } from "./callsign";

test("normaliza minúsculas, espaços e sufixos /M /P", () => {
  expect(normalizarIndicativo(" pu5oni/m ")).toBe("PU5ONI");
  expect(normalizarIndicativo("PU5ONI/P")).toBe("PU5ONI");
  expect(normalizarIndicativo("py5 csm")).toBe("PY5CSM");
});

test("valida indicativos brasileiros", () => {
  expect(indicativoValido("PY5TD")).toBe(true);
  expect(indicativoValido("pu5oni/m")).toBe(true);
  expect(indicativoValido("ZY5ABC")).toBe(true);
  expect(indicativoValido("PU5???")).toBe(false);
  expect(indicativoValido("BaseCosmo")).toBe(false);
  expect(indicativoValido("PZ5AB")).toBe(false);
});

test("reconhece indicativo estrangeiro", () => {
  expect(indicativoEstrangeiro("W1AW")).toBe(true);
  expect(indicativoEstrangeiro("LU1ABC")).toBe(true);
  expect(indicativoEstrangeiro("PU5ONI")).toBe(false);
  expect(indicativoEstrangeiro("BaseCosmo")).toBe(false);
});

test("semelhantes: diferença em exatamente um caractere", () => {
  expect(semelhantes("PU5JEF", "PY5JEF")).toBe(true);
  expect(semelhantes("PU5JEF", "PU5JEF")).toBe(false);
  expect(semelhantes("PU5ONI", "PU5OCM")).toBe(false);
  expect(semelhantes("PU5ON", "PU5ONI")).toBe(false);
});
