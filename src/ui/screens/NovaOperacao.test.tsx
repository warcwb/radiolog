import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../store/db";
import { listarOperacoes, salvarOperacao } from "../../store/repo";
import { op } from "../../test/fabrica";
import { CONFIG_PADRAO, salvarConfig } from "../state";
import { NovaOperacao } from "./NovaOperacao";

beforeEach(async () => {
  await db.delete(); await db.open();
  localStorage.clear();
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC", nome: "Wellington" });
});

test("sugere número, exige nome e frequência e salva", async () => {
  const ir = vi.fn();
  render(<NovaOperacao ir={ir} />);
  expect(await screen.findByDisplayValue(`REER-PR-${new Date().getFullYear()}-001`)).toBe(screen.getByLabelText("Número"));
  await userEvent.click(screen.getByRole("button", { name: "Começar operação" }));
  expect(screen.getByText("Informe o nome")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Nome da operação"), "Travessia");
  await userEvent.click(screen.getByRole("button", { name: "Começar operação" }));
  expect(screen.getByText("Informe a frequência")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Frequência"), "145.210 MHz");
  await userEvent.clear(screen.getByLabelText("Minutos para sem contato"));
  await userEvent.type(screen.getByLabelText("Minutos para sem contato"), "20");
  await userEvent.type(screen.getByLabelText("Lembrete de identificação (min)"), "10");
  await userEvent.click(screen.getByRole("button", { name: "Começar operação" }));
  const [salva] = await listarOperacoes();
  expect(salva).toMatchObject({ nome: "Travessia", frequencia: "145.210 MHz", minutosSemContato: 20, lembreteIdentMin: 10, estacaoLog: { indicativo: "PU5NOC" }, anotador: { indicativo: "PU5NOC", nome: "Wellington" } });
  expect(ir).toHaveBeenCalledWith({ nome: "log", id: salva?.id });
});

test("copia configuração de operação anterior", async () => {
  await salvarOperacao(op({ id: "velha", nome: "Rede semanal", numero: "REER-PR-2026-031", frequencia: "145.210 MHz", repetidora: "PY5CTV" }));
  render(<NovaOperacao ir={vi.fn()} />);
  await screen.findByRole("option", { name: /Rede semanal/ });
  await userEvent.selectOptions(screen.getByLabelText("Copiar configuração de operação anterior"), "velha");
  expect(screen.getByLabelText("Frequência")).toHaveValue("145.210 MHz");
  expect(screen.getByLabelText("Repetidora")).toHaveValue("PY5CTV");
  expect(screen.getByLabelText("Número")).toHaveValue(`REER-PR-${new Date().getFullYear()}-${new Date().getFullYear() === 2026 ? "032" : "001"}`);
});
