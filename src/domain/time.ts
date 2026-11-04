import type { Fuso } from "./types";

const DOZE_HORAS = 12 * 60 * 60 * 1000;
const DIA = 24 * 60 * 60 * 1000;

function dataDe(iso: string, fuso: Fuso): { a: number; m: number; d: number } | null {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return fuso === "UTC" ? { a: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() } : { a: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

/** Converte "HH:MM" digitado em ISO UTC, escolhendo o dia mais próximo da referência (trata a meia-noite). */
export function horaDigitadaParaIso(hhmm: string, dataOperacao: string, referenciaIso: string, fuso: Fuso = "LOCAL"): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  const h = m ? Number(m[1]) : NaN;
  const min = m ? Number(m[2]) : NaN;
  if (!m || h > 23 || min > 59) throw new Error(`Hora inválida: ${hhmm}`);
  const ref = referenciaIso ? dataDe(referenciaIso, fuso) : null;
  const [a, mes, d] = ref ? [ref.a, ref.m, ref.d] : dataOperacao.split("-").map(Number).map((v, i) => (i === 1 ? v - 1 : v));
  let t = fuso === "UTC" ? Date.UTC(a ?? 0, mes ?? 0, d ?? 1, h, min) : new Date(a ?? 0, mes ?? 0, d ?? 1, h, min).getTime();
  if (ref) {
    const r = new Date(referenciaIso).getTime();
    if (t < r - DOZE_HORAS) t += DIA;
    else if (t > r + DOZE_HORAS) t -= DIA;
  }
  return new Date(t).toISOString();
}

const dois = (n: number) => String(n).padStart(2, "0");

export function formatarHora(iso: string, fuso: Fuso): string {
  const t = new Date(iso);
  return fuso === "UTC"
    ? `${dois(t.getUTCHours())}:${dois(t.getUTCMinutes())}Z`
    : `${dois(t.getHours())}:${dois(t.getMinutes())}`;
}

export function dataLocalIso(iso: string): string {
  const t = new Date(iso);
  return `${t.getFullYear()}-${dois(t.getMonth() + 1)}-${dois(t.getDate())}`;
}
