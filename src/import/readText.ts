/** Lê um arquivo de texto em UTF-8; se não for UTF-8 válido, usa Windows-1252 (padrão do Bloco de Notas antigo). */
export async function lerArquivoTexto(f: Blob): Promise<string> {
  const bytes = new Uint8Array(await lerBytes(f));
  let texto: string;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
  }
  return texto.replace(/^﻿/, "");
}

function lerBytes(f: Blob): Promise<ArrayBuffer> {
  if (typeof f.arrayBuffer === "function") return f.arrayBuffer();
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as ArrayBuffer);
    r.onerror = () => falha(r.error);
    r.readAsArrayBuffer(f);
  });
}
