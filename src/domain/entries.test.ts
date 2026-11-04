import { entradasCorrigidas, novaCorrecao, novaEntrada, operadorAtual, OperacaoEncerradaError } from "./entries";
import { novaOperacao } from "./operation";
import type { Entrada } from "./types";

const agora = "2026-10-31T17:00:00.000Z";
const op = novaOperacao({ ncs: { indicativo: "PY5NCS", nome: "" }, estacaoLog: { indicativo: "PU5NOC", equipamento: "", potencia: "", antena: "", grid: "" } }, agora, "op1");
const base = { hora: agora, operador: "PU5NOC", tipo: "SITUACAO" as const, de: "PU5ONI", texto: "Descendo" };

test("padrões de uma entrada nova", () => {
  const e = novaEntrada(op, 1, base, agora);
  expect(e).toMatchObject({ operacaoId: "op1", seq: 1, precedencia: "ROTINA", teste: false, para: "PY5NCS", sensivel: false, posEncerramento: false, origem: "DIGITADO", horaRegistro: agora, horaDesconhecida: false });
});

test("para cai na estação do log quando não há NCS", () => {
  const semNcs = { ...op, ncs: { indicativo: "", nome: "" } };
  expect(novaEntrada(semNcs, 1, base, agora).para).toBe("PU5NOC");
});

test("exercício marca teste", () => {
  expect(novaEntrada({ ...op, tipo: "EXERCICIO" }, 1, base, agora).teste).toBe(true);
});

test("sensível vem do texto quando não informado", () => {
  expect(novaEntrada(op, 1, { ...base, texto: "vítima no km 2" }, agora).sensivel).toBe(true);
  expect(novaEntrada(op, 1, { ...base, texto: "vítima no km 2", sensivel: false }, agora).sensivel).toBe(false);
});

test("operação encerrada só aceita observação e correção", () => {
  const enc = { ...op, status: "ENCERRADA" as const };
  expect(() => novaEntrada(enc, 5, base, agora)).toThrow(OperacaoEncerradaError);
  expect(novaEntrada(enc, 5, { ...base, tipo: "OBSERVACAO" }, agora).posEncerramento).toBe(true);
  const original = novaEntrada(op, 3, base, agora);
  expect(novaCorrecao(enc, 6, original, "QRK era 3", "PU5NOC", agora).posEncerramento).toBe(true);
});

test("correção aponta para a original", () => {
  const original = novaEntrada(op, 3, base, agora);
  const c = novaCorrecao(op, 7, original, "QRK era 3", "PU5NOC", agora);
  expect(c).toMatchObject({ tipo: "CORRECAO", corrige: 3, seq: 7, de: "PU5NOC", texto: "QRK era 3" });
  expect(entradasCorrigidas([original, c])).toEqual(new Map([[3, 7]]));
});

test("operador atual segue a última troca", () => {
  const es: Entrada[] = [novaEntrada(op, 1, base, agora)];
  expect(operadorAtual(es, "PU5NOC")).toBe("PU5NOC");
  es.push(novaEntrada(op, 2, { ...base, tipo: "TROCA_OPERADOR", de: "py5abc" }, agora));
  expect(operadorAtual(es, "PU5NOC")).toBe("PY5ABC");
});
