import { MODOS, type ModoSstv, type PaginaSstv } from "./sstvLayout";

/** Desenha uma página do boletim no tamanho exato do modo SSTV: alto contraste, letra grande. */
export function desenharPagina(p: PaginaSstv, modo: ModoSstv): HTMLCanvasElement {
  const { largura, altura, linhas, colunas } = MODOS[modo];
  const c = document.createElement("canvas");
  c.width = largura;
  c.height = altura;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const h = Math.floor(altura / (linhas + 3));
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, largura, altura);
  ctx.fillStyle = "#b00020";
  ctx.fillRect(0, 0, largura, h);
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.floor(h * 0.7)}px sans-serif`;
  ctx.fillText(p.cabecalho, 4, h / 2);
  // monoespaçada: 0,6 em por caractere, para a linha inteira caber na largura do modo
  const corpo = Math.min(Math.floor(h * 0.85), Math.floor((largura - 8) / colunas / 0.6));
  ctx.font = `bold ${corpo}px monospace`;
  p.linhas.forEach((l, i) => {
    const y = h * (i + 1.25);
    if (l.emergencia) {
      ctx.fillStyle = "#d00000";
      ctx.fillRect(0, y, largura, h);
    }
    ctx.fillStyle = "#fff";
    ctx.fillText(l.texto, 4, y + h / 2);
  });
  ctx.font = `bold ${Math.floor(h * 0.6)}px sans-serif`;
  ctx.fillText(p.rodape, 4, altura - h / 2);
  return c;
}
