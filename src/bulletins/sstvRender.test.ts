import { desenharPagina } from "./sstvRender";

test("desenha a página no tamanho do modo", () => {
  const chamadas: string[] = [];
  const ctx = { fillStyle: "", font: "", textBaseline: "", fillRect: () => undefined, fillText: (t: string) => chamadas.push(t) };
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  const c = desenharPagina({ cabecalho: "PU5NOC 031 14:30", rodape: "pág. 1/1", linhas: [{ texto: "ALERTA", emergencia: true }, { texto: "ok", emergencia: false }] }, "ROBOT36");
  expect([c.width, c.height]).toEqual([320, 240]);
  expect(chamadas).toEqual(["PU5NOC 031 14:30", "ALERTA", "ok", "pág. 1/1"]);
  spy.mockRestore();
});

test("fonte monoespaçada cabe nas colunas do modo", () => {
  const fontes: string[] = [];
  const ctx = { fillStyle: "", textBaseline: "", fillRect: () => undefined, fillText: () => undefined, set font(f: string) { fontes.push(f); }, get font() { return ""; } };
  const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  for (const [modo, largura, colunas] of [["PD120", 640, 48], ["MARTIN1", 320, 24], ["ROBOT36", 320, 24]] as const) {
    fontes.length = 0;
    desenharPagina({ cabecalho: "X", rodape: "Y", linhas: [{ texto: "A".repeat(colunas), emergencia: false }] }, modo);
    const corpo = fontes[1]!;
    expect(corpo).toContain("monospace");
    const px = Number(/(\d+)px/.exec(corpo)?.[1]);
    expect(px * 0.6 * colunas).toBeLessThanOrEqual(largura - 8);
  }
  spy.mockRestore();
});
