import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../store/db";
import * as repo from "../../store/repo";
import { estacao, min, op } from "../../test/fabrica";
import { Estacoes } from "./Estacoes";

beforeEach(async () => {
  await db.delete(); await db.open();
  const o = op();
  await repo.salvarOperacao(o);
  for (const e of [estacao("PY5CSM"), estacao("PU5ONI", "CAMPO", { local: "Trilha" }), estacao("PU5VAZ", "MOVEL")]) await repo.salvarEstacao(e);
  await repo.acrescentarEntrada(o, { hora: min(0), operador: "PU5NOC", tipo: "SITUACAO", de: "PU5ONI", texto: "", qsa: 5, qrk: 3 }, min(0));
  await repo.acrescentarEntrada(o, { hora: min(20), operador: "PU5NOC", tipo: "SITUACAO", de: "PU5VAZ", texto: "" }, min(20));
  await repo.acrescentarEntrada(o, { hora: min(25), operador: "PU5NOC", tipo: "SITUACAO", de: "PY5CSM", texto: "" }, min(25));
});

test("campo e móvel no topo, por tempo sem contato, com situação", async () => {
  render(<Estacoes id="op1" agoraFixo={min(40)} />);
  const linhas = await screen.findAllByRole("row");
  const chaves = linhas.slice(1).map((l) => within(l).getAllByRole("cell")[0]?.textContent);
  expect(chaves).toEqual(["PU5ONI", "PU5VAZ", "PY5CSM"]);
  expect(within(linhas[1]!).getByText("Sem contato (40 min)")).toBeInTheDocument();
  expect(within(linhas[1]!).getByText("14:00")).toBeInTheDocument();
  expect(within(linhas[1]!).getByText("Trilha")).toBeInTheDocument();
  expect(within(linhas[1]!).getByText("5/3")).toBeInTheDocument();
});

test("mudar a função grava a estação", async () => {
  render(<Estacoes id="op1" agoraFixo={min(40)} />);
  await userEvent.selectOptions(await screen.findByLabelText("Função de PY5CSM"), "CAMPO");
  expect((await repo.carregarOperacao("op1"))?.estacoes.find((e) => e.chave === "PY5CSM")?.funcao).toBe("CAMPO");
});
