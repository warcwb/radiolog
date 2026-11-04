import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { exportarTxt } from "../../export/txt";
import { gerarBackup } from "../../store/backup";
import { db } from "../../store/db";
import * as repo from "../../store/repo";
import { entrada, op } from "../../test/fabrica";
import { CONFIG_PADRAO, salvarConfig } from "../state";
import { Importar } from "./Importar";

const colega = readFileSync(resolve(process.cwd(), "docs/referencias/exemplo-log-colega-2026-10-31.txt"), "utf8");
const arquivo = (texto: string, nome = "log.txt") => new File([texto], nome, { type: "text/plain" });

beforeEach(async () => {
  await db.delete(); await db.open();
  localStorage.clear();
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC" });
});

test("prévia do log do colega e só grava ao confirmar", async () => {
  const ir = vi.fn();
  render(<Importar ir={ir} />);
  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo(colega));
  expect(await screen.findByText("38 linhas")).toBeInTheDocument();
  expect(document.querySelector('[data-linha="35"]')).toHaveClass("status-aviso");
  expect(document.querySelector('[data-linha="43"]')).toHaveClass("status-aviso");
  expect(await repo.listarOperacoes()).toEqual([]);
  await userEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));
  const [o] = await repo.listarOperacoes();
  expect(o).toMatchObject({ frequencia: "145.210 MHz", data: "2026-10-31" });
  expect((await repo.carregarOperacao(o!.id))?.entradas).toHaveLength(37);
  expect(ir).toHaveBeenCalledWith({ nome: "log", id: o!.id });
});

test("detecta TXT nativo e backup JSON; operação existente vira cópia", async () => {
  const o = op({ id: "orig" });
  const es = [{ ...entrada(o, "PU5ONI", 0), seq: 1 }];
  await repo.importarLote(o, [], es);
  const ir = vi.fn();
  render(<Importar ir={ir} />);
  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo(JSON.stringify(gerarBackup(o, [], es)), "b.json"));
  expect(await screen.findByText("Esta operação já existe. Importar como cópia?")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Importar como cópia" }));
  const ops = await repo.listarOperacoes();
  expect(ops).toHaveLength(2);
  const copia = ops.find((x) => x.id !== "orig")!;
  expect((await repo.carregarOperacao(copia.id))?.entradas[0]).toMatchObject({ operacaoId: copia.id, de: "PU5ONI" });
  expect(ir).toHaveBeenCalledWith({ nome: "log", id: copia.id });

  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo(exportarTxt(op({ id: "nova-txt" }), [], es)));
  expect(await screen.findByText("2 linhas")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));
  expect(await repo.carregarOperacao("nova-txt")).not.toBeNull();
});

test("arquivo inválido", async () => {
  render(<Importar ir={vi.fn()} />);
  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo("{ não é json", "x.json"));
  expect(await screen.findByText("Arquivo não reconhecido")).toBeInTheDocument();
  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo(""));
  expect(await screen.findByText("Arquivo não reconhecido")).toBeInTheDocument();
});

test("leitura de QR sem câmera avisa e pode ser cancelada", async () => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.reject(new Error("negado")) } });
  render(<Importar ir={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "Ler QR code de outro aparelho" }));
  expect(await screen.findByText(/Não foi possível abrir a câmera/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByText(/Não foi possível abrir a câmera/)).not.toBeInTheDocument();
});

test("cancelar importação de operação repetida", async () => {
  const o = op({ id: "rep" });
  const es = [{ ...entrada(o, "PU5ONI", 0), seq: 1 }];
  await repo.importarLote(o, [], es);
  render(<Importar ir={vi.fn()} />);
  await userEvent.upload(screen.getByLabelText("Arquivo do log"), arquivo(JSON.stringify(gerarBackup(o, [], es)), "b.json"));
  await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
  expect(screen.queryByText(/linhas/)).not.toBeInTheDocument();
  expect(await repo.listarOperacoes()).toHaveLength(1);
});
