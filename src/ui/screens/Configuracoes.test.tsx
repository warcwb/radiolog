import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { carregarConfig } from "../state";
import { Configuracoes } from "./Configuracoes";

test("salva as configurações", async () => {
  localStorage.clear();
  const aoSalvar = vi.fn();
  render(<Configuracoes aoSalvar={aoSalvar} />);
  await userEvent.type(screen.getByLabelText("Seu indicativo"), "pu5noc");
  await userEvent.selectOptions(screen.getByLabelText("Tema"), "noturno");
  await userEvent.selectOptions(screen.getByLabelText("Modo SSTV padrão"), "PD120");
  await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(carregarConfig()).toMatchObject({ indicativo: "PU5NOC", tema: "noturno", modoSstv: "PD120" });
  expect(aoSalvar).toHaveBeenCalled();
  expect(screen.getByText("Configurações salvas")).toBeInTheDocument();
});
