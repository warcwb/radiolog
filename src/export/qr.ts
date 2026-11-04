import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import QRCode from "qrcode";
import { lerBackup, type Backup } from "../store/backup";
import { base45Decode, base45Encode } from "./base45";

export const TAMANHO_PARTE = 1000;
const RE_PARTE = /^RL1\/(\d+)\/(\d+)\/([0-9A-F]{4}):(.*)$/s;

export function gerarPartesQr(backup: Backup): string[] {
  const dados = base45Encode(deflateSync(strToU8(JSON.stringify(backup)), { level: 9 }));
  const id = backup.operacao.id.replace(/-/g, "").slice(0, 4).toUpperCase().padEnd(4, "0");
  const n = Math.max(1, Math.ceil(dados.length / TAMANHO_PARTE));
  return Array.from({ length: n }, (_, i) => `RL1/${i + 1}/${n}/${id}:${dados.slice(i * TAMANHO_PARTE, (i + 1) * TAMANHO_PARTE)}`);
}

export class MontadorQr {
  private partes = new Map<number, string>();
  private total = 0;
  private id = "";

  adicionar(texto: string): { recebidas: number; total: number } {
    const m = RE_PARTE.exec(texto.trim());
    if (!m) throw new Error("QR não é do RadioLog");
    const [, i, n, id, dados] = m as unknown as [string, string, string, string, string];
    if (this.total && (Number(n) !== this.total || id !== this.id)) throw new Error("QR de outro log");
    this.total = Number(n);
    this.id = id;
    this.partes.set(Number(i), dados);
    return { recebidas: this.partes.size, total: this.total };
  }

  completo(): boolean {
    return this.total > 0 && this.partes.size === this.total;
  }

  resultado(): Backup {
    if (!this.completo()) throw new Error("Faltam partes do QR");
    const dados = Array.from({ length: this.total }, (_, i) => this.partes.get(i + 1) ?? "").join("");
    return lerBackup(strFromU8(inflateSync(base45Decode(dados))));
  }
}

export function partesParaImagens(partes: string[]): Promise<string[]> {
  return Promise.all(partes.map((p) => QRCode.toDataURL([{ data: p, mode: "alphanumeric" }], { errorCorrectionLevel: "M", margin: 2, width: 512 })));
}
