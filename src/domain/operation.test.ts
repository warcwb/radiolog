import { copiarConfiguracao, novaOperacao, sugerirNumero } from "./operation";

const agora = "2026-10-31T17:00:00.000Z";

test("sugere o próximo número da sequência", () => {
  expect(sugerirNumero("REER-PR", 2026, ["REER-PR-2026-031"])).toBe("REER-PR-2026-032");
  expect(sugerirNumero("REER-PR", 2026, [])).toBe("REER-PR-2026-001");
  expect(sugerirNumero("REER-PR", 2026, ["REER-PR-2025-090", "OUTRA-2026-050", "REER-PR-2026-009"])).toBe("REER-PR-2026-010");
});

test("nova operação tem os padrões da spec", () => {
  const op = novaOperacao({}, agora, "id-1");
  expect(op).toMatchObject({ id: "id-1", minutosSemContato: 30, lembreteIdentMin: null, status: "ABERTA", fuso: "LOCAL", tipo: "EVENTO", inicio: agora, data: "2026-10-31" });
  expect(novaOperacao({}, agora).id).toMatch(/^[0-9a-f-]{36}$/);
  expect(novaOperacao({ nome: "X", tipo: "EXERCICIO" }, agora).tipo).toBe("EXERCICIO");
});

test("copiar configuração leva rede e equipamento, não identidade", () => {
  const origem = novaOperacao({ numero: "REER-PR-2026-031", nome: "Velha", rede: "REER-PR", frequencia: "145.210 MHz", repetidora: "PY5CTV", offset: "-0.6", tom: "88.5", modo: "FM",
    ncs: { indicativo: "PY5XX", nome: "Fulano" }, estacaoLog: { indicativo: "PU5NOC", equipamento: "FTM-100D", potencia: "20W", antena: "UVS-300", grid: "GG54jm" } }, agora, "id-velha");
  const c = copiarConfiguracao(origem);
  expect(c).toMatchObject({ rede: "REER-PR", frequencia: "145.210 MHz", repetidora: "PY5CTV", offset: "-0.6", tom: "88.5", modo: "FM", ncs: { indicativo: "PY5XX" }, estacaoLog: { equipamento: "FTM-100D" } });
  for (const k of ["id", "numero", "data", "status", "encerramento", "nome"]) expect(c).not.toHaveProperty(k);
});
