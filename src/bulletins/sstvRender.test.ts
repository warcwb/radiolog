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
