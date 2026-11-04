import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../store/db";
import { salvarOperacao } from "../../store/repo";
import { op } from "../../test/fabrica";
import { Operacoes } from "./Operacoes";

beforeEach(async () => { await db.delete(); await db.open(); });

test("lista abertas e encerradas e navega", async () => {
  await salvarOperacao(op({ id: "a", nome: "Travessia", status: "ABERTA" }));
  await salvarOperacao(op({ id: "b", nome: "Exercício antigo", status: "ENCERRADA", inicio: "2026-01-01T10:00:00.000Z" }));
  const ir = vi.fn();
  render(<Operacoes ir={ir} />);
  expect(await screen.findByText(/Travessia/)).toBeInTheDocument();
  expect(screen.getByText(/Exercício antigo/)).toBeInTheDocument();
  expect(screen.getByText("Encerradas")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Travessia/ }));
  expect(ir).toHaveBeenCalledWith({ nome: "log", id: "a" });
  await userEvent.click(screen.getByRole("button", { name: "Nova operação" }));
  expect(ir).toHaveBeenCalledWith({ nome: "nova" });
  await userEvent.click(screen.getByRole("button", { name: "Importar log" }));
  expect(ir).toHaveBeenCalledWith({ nome: "importar" });
});

test("sem operações mostra orientação", async () => {
  render(<Operacoes ir={vi.fn()} />);
  expect(await screen.findByText(/Nenhuma operação ainda/)).toBeInTheDocument();
});
