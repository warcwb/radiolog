import { baixarArquivo } from "./download";

test("baixa arquivo com o nome pedido", () => {
  const cliques: string[] = [];
  const criar = vi.fn(() => "blob:x");
  const revogar = vi.fn();
  Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { cliques.push(this.download); });
  baixarArquivo("REER-PR-2026-031.csv", "a;b", "text/csv");
  baixarArquivo("x.pdf", new Blob([new Uint8Array([1])]), "application/pdf");
  expect(cliques).toEqual(["REER-PR-2026-031.csv", "x.pdf"]);
  expect(criar).toHaveBeenCalledTimes(2);
});
