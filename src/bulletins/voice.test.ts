import { entrada, estacao, min, op } from "../test/fabrica";
import { roteiroVoz } from "./voice";

test("roteiro de voz com abertura, situação, dados reservados e fim", () => {
  const o = op();
  const ests = [estacao("PU5ONI", "CAMPO", { local: "Trilha" })];
  const es = [
    { ...entrada(o, "PU5ONI", 0, { qsa: 5, qrk: 5 }), seq: 1 },
    { ...entrada(o, "PU5ONI", 5, { tipo: "TRAFEGO", precedencia: "EMERGENCIA", texto: "vítima no km 3" }), seq: 2 },
    { ...entrada(o, "PU5ONI", 6, { tipo: "TRAFEGO", precedencia: "PRIORIDADE", texto: "pedimos apoio", sensivel: false }), seq: 3 },
  ];
  const r = roteiroVoz(o, ests, es, min(45));
  expect(r.startsWith("Aqui Papa Uniform Cinco November Oscar Charlie, boletim da operação ")).toBe(true);
  expect(r).toContain("Dois Zero Dois Seis Zero Três Um");
  expect(r).toContain("Papa Uniform Cinco Oscar November India");
  expect(r).toContain("sem contato há 39 minutos");
  expect(r).toContain("dado reservado");
  expect(r).not.toContain("vítima");
  expect(r).toContain("pedimos apoio");
  expect(r.trim().endsWith("Fim do boletim.")).toBe(true);
});
