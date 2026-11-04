import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { interpretarTxtColega } from "./txtColega";

const arquivo = readFileSync(resolve(process.cwd(), "docs/referencias/exemplo-log-colega-2026-10-31.txt"), "utf8");
const p = interpretarTxtColega(arquivo, "PU5NOC");
const linha = (n: number) => p.linhas.find((l) => l.numero === n);
const entradaDaLinha = (n: number) => p.entradas[linha(n)?.entradaIndice ?? -1];
const contar = (tipo: string) => p.entradas.filter((e) => e.tipo === tipo).length;

test("cabeçalho", () => {
  expect(p.operacao).toMatchObject({ frequencia: "145.210 MHz", data: "2026-10-31", rede: "1ªReg. REER-PR", repetidora: "PY5CTV(ARPA)", adjunto: { indicativo: "PU5NOC" } });
  expect(p.operacao.inicio).toBe(new Date("2026-10-31T14:00:00").toISOString());
  expect(p.operacao.fim).toBe(new Date("2026-10-31T16:00:00").toISOString());
  expect(p.operacao.estacaoLog).toMatchObject({ grid: "GG54jm", indicativo: "PU5NOC", potencia: "20W" });
  expect(p.operacao.estacaoLog?.equipamento).toContain("FTM-100D");
});

test("quantidades de entradas por tipo", () => {
  expect(p.entradas).toHaveLength(37);
  expect(p.entradas.filter((e) => e.horaDesconhecida)).toHaveLength(7);
  expect(contar("OBSERVACAO")).toBe(7);
  expect(contar("IDENTIFICACAO")).toBe(6);
  expect(contar("NAO_IDENTIFICADA")).toBe(2);
  expect(contar("ENTRADA_REDE")).toBe(13);
  expect(contar("SITUACAO")).toBe(9);
  expect(p.entradas.every((e) => e.origem === "IMPORTADO" && e.operador === "PU5NOC")).toBe(true);
  expect(p.entradas.map((e) => e.seq)).toEqual(Array.from({ length: 37 }, (_, i) => i + 1));
});

test("estações e nomes", () => {
  expect(p.estacoes).toHaveLength(13);
  expect(p.estacoes.find((e) => e.tatico === "BaseCosmo")).toMatchObject({ indicativo: "", chave: "BASECOSMO" });
  expect(p.estacoes.find((e) => e.chave === "PU5ONI")?.nome).toBe("Edilson");
  expect(p.estacoes.find((e) => e.chave === "PU5MRT")?.nome).toBe("Marco");
  expect(p.estacoes.find((e) => e.chave === "PY5JEF")?.nome).toBe("");
});

test("texto, nome e sinal de cada linha", () => {
  expect(entradaDaLinha(22)).toMatchObject({ de: "PY5CSM", texto: "Agua Verde", tipo: "ENTRADA_REDE" });
  expect(entradaDaLinha(21)?.texto).toBe("Tatuquara - IC-V8 com FlowerPot");
  expect(entradaDaLinha(30)).toMatchObject({ de: "PY5CSM", texto: "Em QRV", tipo: "SITUACAO" });
  expect(p.estacoes.find((e) => e.chave === "PY5CSM")?.nome).toBe("Charles");
  expect(entradaDaLinha(24)).toMatchObject({ de: "PU5ONI", qsa: 5, qrk: 3, texto: expect.stringContaining("Descendo pelas pedras") });
  expect(entradaDaLinha(19)?.texto).toBe("Deslocamento BaseCOSMO-Prainha");
  expect(entradaDaLinha(37)).toMatchObject({ de: "BASECOSMO", texto: "Poucas pessoas no parque - Tempo instável." });
  expect(entradaDaLinha(27)).toMatchObject({ tipo: "NAO_IDENTIFICADA", de: "PU5???", qrk: 2 });
  expect(entradaDaLinha(13)).toMatchObject({ tipo: "IDENTIFICACAO", de: "PU5NOC" });
});

test("avisos e pendências", () => {
  expect(linha(35)?.avisos.map((a) => a.codigo)).toContain("SEMELHANTE");
  expect(linha(43)?.avisos.map((a) => a.codigo)).toContain("AMBIGUO_SEGURANCA");
  expect(p.pendenciasSugeridas).toEqual([{ estacao: "", texto: "35 pessoas visitaram o parque a grande maioria desceram em seguranca." }]);
  const resumo = linha(0);
  expect(resumo?.avisos.find((a) => a.codigo === "SEM_SAIDA")?.texto).toContain("13 estações");
  expect(p.linhas).toHaveLength(38);
  expect(p.linhas.some((l) => l.status === "NAO_RECONHECIDA")).toBe(false);
  expect(linha(27)?.status).toBe("AVISO");
});

test("hora depois da meia-noite cai no dia seguinte", () => {
  const r = interpretarTxtColega("2026.10.31\n23:50 PU5ONI QSA-5 QRK-5\n00:10 PU5ONI QSA-5 QRK-5", "PU5NOC");
  expect(r.entradas[1]?.hora).toBe(new Date("2026-11-01T00:10:00").toISOString());
});

test("linha sem padrão vira observação não reconhecida, nunca é descartada", () => {
  const r = interpretarTxtColega("2026.10.31\nxyz qualquer", "PU5NOC");
  expect(r.entradas).toHaveLength(1);
  expect(r.entradas[0]).toMatchObject({ tipo: "OBSERVACAO", texto: "xyz qualquer" });
  expect(r.linhas.find((l) => l.numero === 2)?.status).toBe("NAO_RECONHECIDA");
});

test("hora fora do período e hora que volta geram aviso; estrangeiro também", () => {
  const r = interpretarTxtColega("2026.10.31\nDisponibilidade: Das 14:00hrs às 16:00hrs\n14:30 PU5ONI\n14:20 PU5ONI\n17:00 W1AW", "PU5NOC");
  expect(r.linhas.find((l) => l.numero === 4)?.avisos.map((a) => a.codigo)).toContain("HORA_RETROCEDE");
  const l5 = r.linhas.find((l) => l.numero === 5)?.avisos.map((a) => a.codigo);
  expect(l5).toEqual(expect.arrayContaining(["FORA_PERIODO", "ESTRANGEIRO"]));
});
