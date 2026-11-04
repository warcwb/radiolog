import { lerArquivoTexto } from "./readText";

test("lê arquivo salvo em Windows-1252 (Bloco de Notas antigo)", async () => {
  expect(await lerArquivoTexto(new Blob([Uint8Array.from([0x41, 0xe7, 0xe3, 0x6f])]))).toBe("Ação");
});

test("lê UTF-8 normal e remove o BOM", async () => {
  expect(await lerArquivoTexto(new Blob(["Ação"]))).toBe("Ação");
  expect(await lerArquivoTexto(new Blob(["﻿Ação"]))).toBe("Ação");
});
