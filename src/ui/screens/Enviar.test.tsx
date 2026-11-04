import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { db } from "../../store/db";
import * as repo from "../../store/repo";
import { estacao, min, op } from "../../test/fabrica";
import { CONFIG_PADRAO, salvarConfig } from "../state";
import { Enviar } from "./Enviar";

beforeEach(async () => {
  await db.delete(); await db.open();
  localStorage.clear();
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC", modoSstv: "PD120" });
  const o = op();
  await repo.salvarOperacao(o);
  await repo.salvarEstacao(estacao("PU5ONI", "CAMPO", { local: "Trilha" }));
  await repo.acrescentarEntrada(o, { hora: min(0), operador: "PU5NOC", tipo: "ENTRADA_REDE", de: "PU5ONI", texto: "" }, min(0));
  await repo.acrescentarEntrada(o, { hora: min(5), operador: "PU5NOC", tipo: "TRAFEGO", de: "PU5ONI", texto: "vítima no km 2", precedencia: "EMERGENCIA" }, min(5));
});

test("SSTV: prévia, modo padrão das configurações e aviso de sensível", async () => {
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={vi.fn()} />);
  await userEvent.click(await screen.findByRole("button", { name: "SSTV" }));
  expect(screen.getByLabelText("Modo")).toHaveValue("PD120");
  expect(screen.getByText("1 dado(s) sensível(is) ocultado(s)")).toBeInTheDocument();
  expect(screen.getAllByText(/\[dado reservado\]/).length).toBeGreaterThan(0);
  expect(screen.getByText("pág. 1/1")).toBeInTheDocument();
});

test("SSTV: baixar PNG", async () => {
  const baixar = vi.fn();
  const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(new Blob(["png"])));
  const ctx = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={baixar} />);
  await userEvent.click(await screen.findByRole("button", { name: "SSTV" }));
  await userEvent.selectOptions(screen.getByLabelText("Boletim"), "EQUIPES");
  await userEvent.click(screen.getByRole("button", { name: "Baixar PNG 1" }));
  expect(baixar).toHaveBeenCalledWith("REER-PR-2026-031-sstv-equipes-1.png", expect.any(Blob), "image/png");
  toBlob.mockRestore();
  ctx.mockRestore();
});

test("APRS: copiar, e mostrar o texto quando a cópia falha", async () => {
  const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("negado"));
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={vi.fn()} />);
  await userEvent.click(await screen.findByRole("button", { name: "APRS" }));
  expect(screen.getByText("1 dado(s) sensível(is) ocultado(s)")).toBeInTheDocument();
  const [copiar] = screen.getAllByRole("button", { name: "Copiar" });
  await userEvent.click(copiar!);
  expect(writeText).toHaveBeenCalledWith("OP031 PU5ONI OK TRILHA 1405");
  expect(await screen.findByText("Copiado")).toBeInTheDocument();
  await userEvent.click(copiar!);
  expect(await screen.findByText(/Selecione e copie/)).toBeInTheDocument();
});

test("Voz: roteiro sem o dado sensível", async () => {
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={vi.fn()} />);
  await userEvent.click(await screen.findByRole("button", { name: "Voz" }));
  expect(screen.getByText(/Fim do boletim/)).toBeInTheDocument();
  expect(screen.queryByText(/vítima/)).not.toBeInTheDocument();
});

test("arquivos: backup, TXT e CSV mantêm os dados completos", async () => {
  const baixar = vi.fn();
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={baixar} />);
  await userEvent.click(await screen.findByRole("button", { name: "QR / arquivo" }));
  expect(screen.queryByText(/sensível\(is\) ocultado/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Arquivo de backup (JSON)" }));
  await userEvent.click(screen.getByRole("button", { name: "TXT" }));
  await userEvent.click(screen.getByRole("button", { name: "CSV (planilha)" }));
  expect(baixar.mock.calls.map((c) => c[0])).toEqual(["REER-PR-2026-031-backup.json", "REER-PR-2026-031.txt", "REER-PR-2026-031.csv"]);
  expect(String(baixar.mock.calls[2]?.[1])).toContain("vítima no km 2");
});

test("QR: mostra a sequência com navegação", async () => {
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={vi.fn()} />);
  await userEvent.click(await screen.findByRole("button", { name: "QR / arquivo" }));
  await userEvent.click(screen.getByRole("button", { name: "Mostrar QR codes" }));
  expect(await screen.findByText("QR 1/1")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "QR 1/1" })).toHaveAttribute("src", expect.stringMatching(/^data:image\/png/));
});

test("ICS 309: falha mostra o motivo e oferece CSV", async () => {
  const baixar = vi.fn();
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={baixar} gerarPdf={() => { throw new Error("memória"); }} />);
  await userEvent.click(await screen.findByRole("button", { name: "ICS 309" }));
  await userEvent.click(screen.getByRole("button", { name: "Baixar ICS 309 (PDF)" }));
  expect(screen.getByText("Não foi possível gerar o PDF: memória")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Gerar CSV" }));
  expect(baixar).toHaveBeenCalledWith("REER-PR-2026-031.csv", expect.any(String), "text/csv");
});

test("ICS 309: baixa o PDF", async () => {
  const baixar = vi.fn();
  render(<Enviar id="op1" agoraFixo={min(10)} baixar={baixar} />);
  await userEvent.click(await screen.findByRole("button", { name: "ICS 309" }));
  await userEvent.click(screen.getByRole("button", { name: "Baixar ICS 309 (PDF)" }));
  expect(baixar).toHaveBeenCalledWith("REER-PR-2026-031-ics309.pdf", expect.any(Uint8Array), "application/pdf");
});
