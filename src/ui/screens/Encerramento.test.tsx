import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../store/db";
import * as repo from "../../store/repo";
import { estacao, min, op } from "../../test/fabrica";
import { CONFIG_PADRAO, salvarConfig } from "../state";
import { Encerramento } from "./Encerramento";

beforeEach(async () => {
  await db.delete(); await db.open();
  localStorage.clear();
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC" });
  const o = op();
  await repo.salvarOperacao(o);
  await repo.salvarEstacao(estacao("PU5ONI", "CAMPO"));
  await repo.salvarEstacao(estacao("PY5CSM"));
  await repo.acrescentarEntrada(o, { hora: min(0), operador: "PU5NOC", tipo: "ENTRADA_REDE", de: "PU5ONI", texto: "" }, min(0));
  await repo.acrescentarEntrada(o, { hora: min(1), operador: "PU5NOC", tipo: "ENTRADA_REDE", de: "PY5CSM", texto: "" }, min(1));
});

test("bloqueia sem saída e libera com justificativa; encerra e oferece documentos", async () => {
  const baixar = vi.fn();
  render(<Encerramento id="op1" agoraFixo={min(120)} baixar={baixar} />);
  expect(await screen.findByText("PU5ONI sem saída registrada")).toBeInTheDocument();
  const botao = screen.getByRole("button", { name: "Encerrar operação" });
  expect(botao).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Justificativa"), "Equipe confirmou por telefone");
  expect(botao).toBeEnabled();
  await userEvent.type(screen.getByLabelText("Pendências (uma por linha)"), "PU5ONI devolver rádio");
  await userEvent.type(screen.getByLabelText("Entregue a"), "COSMO");
  await userEvent.click(botao);
  const salvo = (await repo.carregarOperacao("op1"))?.op;
  expect(salvo).toMatchObject({ status: "ENCERRADA", fim: min(120), encerramento: { totalEstacoes: 2, responsavel: "PU5NOC", entregueA: "COSMO", justificativa: "Equipe confirmou por telefone", pendencias: [{ estacao: "", texto: "PU5ONI devolver rádio" }] } });
  await userEvent.click(await screen.findByRole("button", { name: "Gerar ICS 309" }));
  expect(baixar).toHaveBeenCalledWith("REER-PR-2026-031-ics309.pdf", expect.any(Uint8Array), "application/pdf");
  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(new Blob(["png"])));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  await userEvent.click(screen.getByRole("button", { name: "Boletim final SSTV" }));
  expect(baixar).toHaveBeenCalledWith("REER-PR-2026-031-sstv-encerramento-1.png", expect.any(Blob), "image/png");
  toBlob.mockRestore();
});

test("com todas as saídas, encerra direto", async () => {
  const o = (await repo.carregarOperacao("op1"))!.op;
  await repo.acrescentarEntrada(o, { hora: min(30), operador: "PU5NOC", tipo: "SAIDA", de: "PU5ONI", texto: "" }, min(30));
  render(<Encerramento id="op1" agoraFixo={min(120)} baixar={vi.fn()} />);
  expect(await screen.findByText("Todas as equipes de campo registraram saída.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Encerrar operação" })).toBeEnabled();
});
