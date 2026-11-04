const SUFIXOS = /\/(MM|AM|QRP|M|P|\d)$/;

export function normalizarIndicativo(s: string): string {
  return s.toUpperCase().replace(/\s+/g, "").replace(SUFIXOS, "");
}

export function indicativoValido(s: string): boolean {
  return /^(P[P-Y]|Z[V-Z])\d[A-Z]{1,3}$/.test(normalizarIndicativo(s));
}

export function indicativoEstrangeiro(s: string): boolean {
  const n = normalizarIndicativo(s);
  return /^[A-Z0-9]{1,3}\d[A-Z]{1,4}$/.test(n) && /[A-Z]/.test(n.slice(0, 2)) && !/^(P[P-Y]|Z[V-Z])/.test(n);
}

export function semelhantes(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) dif++;
  return dif === 1;
}
