import { entrada, estacao, op } from "../test/fabrica";
import { exportarCsv } from "./csv";

test("CSV com BOM, cabeçalho e aspas quando precisa", () => {
  const o = op();
  const csv = exportarCsv(o, [estacao("PU5ONI")], [{ ...entrada(o, "PU5ONI", 5, { qsa: 5, qrk: 4, texto: 'Disse "ok"; seguindo' }), seq: 1 }]);
  expect(csv.startsWith("﻿")).toBe(true);
  const [cab, linha] = csv.slice(1).split("\r\n");
  expect(cab).toBe("seq;hora;tipo;de;para;qsa;qrk;local;grid;precedencia;teste;numMensagem;texto;sensivel;corrige;operador;origem");
  expect(linha).toBe('1;14:05;SITUACAO;PU5ONI;PU5NOC;5;4;;;ROTINA;não;;"Disse ""ok""; seguindo";não;;PU5NOC;DIGITADO');
});

test("CSV respeita o fuso UTC", () => {
  const o = op({ fuso: "UTC" });
  expect(exportarCsv(o, [], [{ ...entrada(o, "X", 0), seq: 1 }])).toContain(";17:00Z;");
});
