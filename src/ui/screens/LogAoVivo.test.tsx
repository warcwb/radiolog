import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Operacao } from "../../domain/types";
import { db } from "../../store/db";
import * as repo from "../../store/repo";
import { estacao, min, op, T0 } from "../../test/fabrica";
import { CONFIG_PADRAO, salvarConfig } from "../state";
import { LogAoVivo } from "./LogAoVivo";

let o: Operacao;

beforeEach(async () => {
  await db.delete(); await db.open();
  localStorage.clear();
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC" });
  o = op();
  await repo.salvarOperacao(o);
  await repo.salvarEstacao(estacao("PU5ONI", "CAMPO", { nome: "Edilson" }));
  await repo.acrescentarEntrada(o, { hora: T0, operador: "PU5NOC", tipo: "ENTRADA_REDE", de: "PU5ONI", texto: "", qsa: 5, qrk: 3 }, T0);
});

const entradas = async () => (await repo.carregarOperacao("op1"))!.entradas;
const renderizar = (props: Partial<Parameters<typeof LogAoVivo>[0]> = {}) => render(<LogAoVivo id="op1" ir={vi.fn()} agoraFixo={min(10)} {...props} />);

test("estação conhecida: digitar, tocar na sugestão e registrar (2 toques)", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "pu5o");
  await userEvent.click(screen.getByRole("button", { name: "PU5ONI" }));
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  await screen.findByText("#2");
  const e = (await entradas())[1];
  expect(e).toMatchObject({ tipo: "SITUACAO", de: "PU5ONI", qsa: 5, qrk: 3, operador: "PU5NOC" });
  expect(screen.getByLabelText("Indicativo")).toHaveValue("");
});

test("estação nova abre mini cadastro e registra entrada na rede", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "py5abc");
  await userEvent.click(screen.getByRole("button", { name: "QSA 4" }));
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  const cadastro = await screen.findByRole("group", { name: "Nova estação PY5ABC" });
  await userEvent.type(within(cadastro).getByLabelText("Nome"), "Ana");
  await userEvent.selectOptions(within(cadastro).getByLabelText("Função"), "CAMPO");
  await userEvent.click(within(cadastro).getByRole("button", { name: "Salvar estação e registrar" }));
  await screen.findByText("#2");
  const r = await repo.carregarOperacao("op1");
  expect(r?.estacoes.find((e) => e.chave === "PY5ABC")).toMatchObject({ nome: "Ana", funcao: "CAMPO" });
  expect(r?.entradas[1]).toMatchObject({ tipo: "ENTRADA_REDE", de: "PY5ABC", qsa: 4 });
});

test("IDENT e ? registram com um toque", async () => {
  renderizar();
  await userEvent.click(await screen.findByRole("button", { name: "IDENT" }));
  await screen.findByText("#2");
  await userEvent.type(screen.getByLabelText("Texto"), "fraco, final 3");
  await userEvent.click(screen.getByRole("button", { name: "Não identificada (?)" }));
  await screen.findByText("#3");
  const es = await entradas();
  expect(es[1]).toMatchObject({ tipo: "IDENTIFICACAO", de: "PU5NOC" });
  expect(es[2]).toMatchObject({ tipo: "NAO_IDENTIFICADA", texto: "fraco, final 3" });
});

test("precedência colore a linha e hora ajustada é respeitada", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  await userEvent.click(screen.getByRole("button", { name: "Mais opções" }));
  await userEvent.selectOptions(screen.getByLabelText("Precedência"), "EMERGENCIA");
  await userEvent.type(screen.getByLabelText("Hora"), "14:05");
  await userEvent.type(screen.getByLabelText("Texto"), "pedido de resgate{Enter}");
  const linha = (await screen.findByText("#2")).closest("li");
  expect(linha).toHaveClass("prec-emergencia");
  expect((await entradas())[1]).toMatchObject({ precedencia: "EMERGENCIA", hora: min(5) });
});

test("corrigir uma entrada", async () => {
  renderizar();
  await userEvent.click(await screen.findByText("#1"));
  await userEvent.click(screen.getByRole("button", { name: "Corrigir" }));
  await userEvent.type(screen.getByLabelText("Texto da correção"), "QRK era 4");
  await userEvent.click(screen.getByRole("button", { name: "Confirmar correção" }));
  expect(await screen.findByText("corrigida por #2")).toBeInTheDocument();
  expect((await screen.findByText("#1")).closest("li")).toHaveClass("corrigida");
  expect((await entradas())[1]).toMatchObject({ tipo: "CORRECAO", corrige: 1, texto: "QRK era 4" });
});

test("alerta de sem contato e lembrete de identificação", async () => {
  await repo.salvarOperacao({ ...o, lembreteIdentMin: 10 });
  renderizar({ agoraFixo: min(31) });
  expect(await screen.findByText("PU5ONI sem contato há 31 min")).toBeInTheDocument();
  expect(screen.getByText("Identifique a estação (31 min)")).toBeInTheDocument();
});

test("falha ao gravar mantém o texto e avisa", async () => {
  renderizar({ acoes: { acrescentarEntrada: () => Promise.reject(new Error("disco cheio")) } });
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  await userEvent.type(screen.getByLabelText("Texto"), "importante");
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  expect(await screen.findByText(/Não foi possível salvar/)).toBeInTheDocument();
  expect(screen.getByLabelText("Texto")).toHaveValue("importante");
});

test("lembrete de backup na 30ª entrada", async () => {
  for (let i = 0; i < 28; i++) await repo.acrescentarEntrada(o, { hora: T0, operador: "PU5NOC", tipo: "SITUACAO", de: "PU5ONI", texto: "" }, T0);
  renderizar();
  await screen.findByText("#29");
  await userEvent.click(screen.getByRole("button", { name: "IDENT" }));
  expect(await screen.findByText(/Faça um backup/)).toBeInTheDocument();
});

test("troca de operador vale para as entradas seguintes", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "py5abc");
  await userEvent.click(screen.getByRole("button", { name: "Mais opções" }));
  await userEvent.selectOptions(screen.getByLabelText("Outro tipo"), "TROCA_OPERADOR");
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  await screen.findByText("#2");
  await userEvent.click(screen.getByRole("button", { name: "IDENT" }));
  await screen.findByText("#3");
  expect((await entradas())[2]).toMatchObject({ operador: "PY5ABC" });
});

test("operação encerrada só aceita observação", async () => {
  await repo.salvarOperacao({ ...o, status: "ENCERRADA" });
  renderizar();
  expect(await screen.findByText(/Operação encerrada/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "REGISTRAR" })).not.toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Texto"), "nota final");
  await userEvent.click(screen.getByRole("button", { name: "Registrar observação" }));
  await screen.findByText("#2");
  expect((await entradas())[1]).toMatchObject({ tipo: "OBSERVACAO", posEncerramento: true });
});

test("indicativo vazio avisa", async () => {
  renderizar();
  await userEvent.click(await screen.findByRole("button", { name: "REGISTRAR" }));
  expect(screen.getByText("Informe o indicativo")).toBeInTheDocument();
});

test("hora inválida avisa e não grava", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  await userEvent.type(screen.getByLabelText("Hora"), "25:00");
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  expect(screen.getByText("Hora inválida: 25:00")).toBeInTheDocument();
  expect(await entradas()).toHaveLength(1);
});

test("ditado pelo microfone preenche o texto quando o navegador oferece", async () => {
  class Rec { lang = ""; onresult: (e: unknown) => void = () => undefined; start() { this.onresult({ results: { 0: { 0: { transcript: "tudo certo" } } } }); } }
  (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = Rec;
  renderizar();
  await userEvent.click(await screen.findByRole("button", { name: "Ditar" }));
  expect(screen.getByLabelText("Texto")).toHaveValue("tudo certo");
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
});

test("falha ao gravar correção avisa", async () => {
  renderizar({ acoes: { acrescentarCorrecao: () => Promise.reject(new Error("falhou")) } });
  await userEvent.click(await screen.findByText("#1"));
  await userEvent.click(screen.getByRole("button", { name: "Corrigir" }));
  await userEvent.click(screen.getByRole("button", { name: "Confirmar correção" }));
  expect(await screen.findByText(/Não foi possível salvar: falhou/)).toBeInTheDocument();
});

test("as fileiras de sinal mostram QSA e QRK", async () => {
  renderizar();
  expect(await screen.findByText("QSA", { selector: ".notas span" })).toBeInTheDocument();
  expect(screen.getByText("QRK", { selector: ".notas span" })).toBeInTheDocument();
});

test("toque duplo em REGISTRAR grava uma vez só", async () => {
  let liberar: () => void = () => undefined;
  const chamadas: unknown[] = [];
  const lento = (...args: Parameters<typeof repo.acrescentarEntrada>) => { chamadas.push(args); return new Promise<never>((_, rej) => { liberar = () => rej(new Error("x")); }); };
  renderizar({ acoes: { acrescentarEntrada: lento } });
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  const b = screen.getByRole("button", { name: "REGISTRAR" });
  await userEvent.click(b);
  await userEvent.click(b);
  await userEvent.type(screen.getByLabelText("Texto"), "{Enter}");
  expect(chamadas).toHaveLength(1);
  liberar();
});

test("operador marca e desmarca dado sensível antes de gravar", async () => {
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  await userEvent.type(screen.getByLabelText("Texto"), "Maria Souza levada ao posto 2");
  const caixa = screen.getByLabelText("Dado sensível (não vai ao ar)");
  expect(caixa).not.toBeChecked();
  await userEvent.click(caixa);
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  await screen.findByText("#2");
  await userEvent.type(screen.getByLabelText("Indicativo"), "PU5ONI");
  await userEvent.type(screen.getByLabelText("Texto"), "vítima resgatada");
  expect(screen.getByLabelText("Dado sensível (não vai ao ar)")).toBeChecked();
  await userEvent.click(screen.getByLabelText("Dado sensível (não vai ao ar)"));
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  await screen.findByText("#3");
  const es = await entradas();
  expect(es[1]?.sensivel).toBe(true);
  expect(es[2]?.sensivel).toBe(false);
});

test("hora digitada em operação UTC é Zulu", async () => {
  await repo.salvarOperacao({ ...o, fuso: "UTC" });
  renderizar();
  await userEvent.type(await screen.findByLabelText("Indicativo"), "PU5ONI");
  await userEvent.type(screen.getByLabelText("Hora"), "17:05");
  await userEvent.click(screen.getByRole("button", { name: "REGISTRAR" }));
  await screen.findByText("#2");
  expect((await entradas())[1]?.hora).toBe("2026-10-31T17:05:00.000Z");
});
