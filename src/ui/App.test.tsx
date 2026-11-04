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
