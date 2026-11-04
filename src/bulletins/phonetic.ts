const ICAO: Record<string, string> = {
  A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel", I: "India",
  J: "Juliett", K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo",
  S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
};
const DIGITOS = ["Zero", "Um", "Dois", "Três", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove"];

const digito = (c: string) => DIGITOS[Number(c)] ?? c;

export function soletrar(s: string): string {
  return [...s.toUpperCase()]
    .map((c) => (/\d/.test(c) ? digito(c) : c === "/" ? "Barra" : ICAO[c]))
    .filter(Boolean)
    .join(" ");
}

/** Lê números dígito a dígito e mantém as letras: "REER-PR-2026-031" → "REER PR Dois Zero Dois Seis Zero Três Um". */
export function falarNumero(s: string): string {
  return s.replace(/\d/g, (c) => ` ${digito(c)} `).replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim();
}
