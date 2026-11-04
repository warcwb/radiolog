const PALAVRAS = /\b(vitima|ferid|obito|morto|morta|desaparecid|hospitaliz)/;
const TELEFONE = /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/;
const CPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/;

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Marca texto com termos de vítimas, telefone ou CPF. Nomes de pessoas não são detectáveis com segurança. */
export function detectarSensivel(texto: string): boolean {
  return PALAVRAS.test(semAcento(texto)) || TELEFONE.test(texto) || CPF.test(texto);
}
