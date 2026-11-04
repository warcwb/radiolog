// RFC 9285. O alfabeto coincide com o modo alfanumérico do QR code.
const ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

export function base45Encode(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i += 2) {
    if (i + 1 < b.length) {
      let n = b[i]! * 256 + b[i + 1]!;
      for (let k = 0; k < 3; k++) { s += ALFABETO[n % 45]; n = Math.floor(n / 45); }
    } else {
      const n = b[i]!;
      s += ALFABETO[n % 45]! + ALFABETO[Math.floor(n / 45)]!;
    }
  }
  return s;
}

export function base45Decode(s: string): Uint8Array {
  const v = [...s].map((c) => {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error("base45 inválido");
    return i;
  });
  if (v.length % 3 === 1) throw new Error("base45 inválido");
  const out: number[] = [];
  for (let i = 0; i < v.length; i += 3) {
    const n = v[i]! + v[i + 1]! * 45 + (i + 2 < v.length ? v[i + 2]! * 2025 : 0);
    if (i + 2 < v.length) {
      if (n > 0xffff) throw new Error("base45 inválido");
      out.push(n >> 8, n & 0xff);
    } else {
      if (n > 0xff) throw new Error("base45 inválido");
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}
