import { carregarConfig, CONFIG_PADRAO, salvarConfig, verificarEspaco } from "./state";

afterEach(() => vi.restoreAllMocks());

test("config: padrão, salvar e carregar", () => {
  localStorage.clear();
  expect(carregarConfig()).toEqual(CONFIG_PADRAO);
  expect(CONFIG_PADRAO).toMatchObject({ sigla: "REER-PR", modoSstv: "ROBOT36", tema: "escuro", fonte: "normal" });
  salvarConfig({ ...CONFIG_PADRAO, indicativo: "PU5NOC" });
  expect(carregarConfig().indicativo).toBe("PU5NOC");
});

test("config: localStorage com erro devolve o padrão", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
  expect(carregarConfig()).toEqual(CONFIG_PADRAO);
  expect(() => salvarConfig(CONFIG_PADRAO)).not.toThrow();
});

test("verificar espaço", async () => {
  const nav = navigator as { storage?: unknown };
  const original = nav.storage;
  Object.defineProperty(navigator, "storage", { configurable: true, value: { estimate: async () => ({ usage: 81, quota: 100 }) } });
  expect(await verificarEspaco()).toBe(true);
  Object.defineProperty(navigator, "storage", { configurable: true, value: { estimate: async () => ({ usage: 79, quota: 100 }) } });
  expect(await verificarEspaco()).toBe(false);
  Object.defineProperty(navigator, "storage", { configurable: true, value: undefined });
  expect(await verificarEspaco()).toBe(false);
  Object.defineProperty(navigator, "storage", { configurable: true, value: original });
});
