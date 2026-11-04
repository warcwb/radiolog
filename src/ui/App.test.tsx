import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../store/db";
import { App } from "./App";

beforeEach(async () => { await db.delete(); await db.open(); localStorage.clear(); });

test("mostra o título RadioLog", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "RadioLog" })).toBeInTheDocument();
});

test("navega para configurações e aplica o tema", async () => {
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "Configurações" }));
  await userEvent.selectOptions(screen.getByLabelText("Tema"), "noturno");
  await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(document.documentElement).toHaveClass("tema-noturno");
  await userEvent.click(screen.getByRole("button", { name: "Início" }));
  expect(await screen.findByRole("button", { name: "Nova operação" })).toBeInTheDocument();
});

test("abrir uma operação mostra as abas e navega entre elas", async () => {
  const { salvarOperacao } = await import("../store/repo");
  const { op } = await import("../test/fabrica");
  await salvarOperacao(op());
  render(<App />);
  await userEvent.click(await screen.findByRole("button", { name: /Travessia/ }));
  const abas = await screen.findByRole("navigation", { name: "Operação" });
  expect(abas).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Estações" }));
  expect(await screen.findByRole("heading", { name: /Estações/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
  expect(await screen.findByRole("heading", { name: "Enviar" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Encerrar" }));
  expect(await screen.findByRole("heading", { name: "Encerramento" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Log" }));
  expect(await screen.findByLabelText("Indicativo")).toBeInTheDocument();
});

test("mostra avisos de armazenamento", () => {
  render(<App avisos={["O navegador pode apagar os dados. Faça backups."]} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Faça backups");
});
