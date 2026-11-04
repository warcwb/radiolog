/** Entrega um arquivo para o usuário salvar (funciona offline). */
export function baixarArquivo(nome: string, conteudo: Blob | string | Uint8Array, tipo: string): void {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo as BlobPart], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
