import * as repo from "./repo";
import { db } from "./db";
import { op, estacao, T0, entrada } from "../test/fabrica";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const input = { hora: T0, operador: "PU5NOC", tipo: "SITUACAO" as const, de: "PU5ONI", texto: "ok" };

test("acrescenta entradas em sequência", async () => {
  const o = op();
  await repo.salvarOperacao(o);
  const seqs = [];
  for (let i = 0; i < 3; i++) seqs.push((await repo.acrescentarEntrada(o, input, T0)).seq);
  expect(seqs).toEqual([1, 2, 3]);
});

test("registros simultâneos não repetem seq", async () => {
  const o = op();
  await repo.salvarOperacao(o);
  const r = await Promise.all([repo.acrescentarEntrada(o, input, T0), repo.acrescentarEntrada(o, input, T0), repo.acrescentarEntrada(o, input, T0)]);
  expect(r.map((e) => e.seq).sort()).toEqual([1, 2, 3]);
});

test("não existe função de editar ou apagar entradas", () => {
  for (const k of Object.keys(repo)) expect(k).not.toMatch(/^(atualizar|apagar|excluir|remover|update|delete)/i);
});

test("carrega operação com estações e entradas; correção aponta para a original", async () => {
  const o = op();
  await repo.salvarOperacao(o);
  await repo.salvarEstacao(estacao("PU5ONI", "CAMPO"));
  const e1 = await repo.acrescentarEntrada(o, input, T0);
  const c = await repo.acrescentarCorrecao(o, e1, "QRK era 3", "PU5NOC", T0);
  const r = await repo.carregarOperacao("op1");
  expect(r?.estacoes.map((e) => e.chave)).toEqual(["PU5ONI"]);
  expect(r?.entradas.map((e) => e.seq)).toEqual([1, 2]);
  expect(c).toMatchObject({ seq: 2, corrige: 1 });
  expect(await repo.carregarOperacao("nada")).toBeNull();
});

test("lista operações, mais recentes primeiro", async () => {
  await repo.salvarOperacao(op({ id: "a", inicio: "2026-10-01T10:00:00.000Z" }));
  await repo.salvarOperacao(op({ id: "b", inicio: "2026-10-31T10:00:00.000Z" }));
  expect((await repo.listarOperacoes()).map((o) => o.id)).toEqual(["b", "a"]);
});

test("encerrar muda o status", async () => {
  const o = op();
  await repo.salvarOperacao(o);
  const enc = await repo.encerrarOperacao(o, { hora: T0, totalEstacoes: 1, pendencias: [], justificativa: "", responsavel: "PU5NOC", entregueA: "COSMO" });
  expect(enc.status).toBe("ENCERRADA");
  expect((await repo.carregarOperacao("op1"))?.op).toMatchObject({ status: "ENCERRADA", fim: T0 });
});

test("importar lote grava tudo ou nada", async () => {
  const o = op({ id: "imp" });
  const boas = [entrada(o, "PU5ONI", 0), entrada(o, "PU5ONI", 1)].map((e, i) => ({ ...e, seq: i + 1 }));
  await repo.importarLote(o, [estacao("PU5ONI", "FIXA", { operacaoId: "imp" })], boas);
  expect((await repo.carregarOperacao("imp"))?.entradas).toHaveLength(2);

  const o2 = op({ id: "ruim" });
  const ruins = [{ ...boas[0]!, operacaoId: "ruim" }, { ...boas[1]!, operacaoId: "ruim", seq: Number.NaN }];
  await expect(repo.importarLote(o2, [], ruins)).rejects.toThrow("Entrada inválida");
  expect(await repo.carregarOperacao("ruim")).toBeNull();
});
