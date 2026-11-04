import { base45Decode, base45Encode } from "./base45";

const b = (s: string) => new TextEncoder().encode(s);
const s = (u: Uint8Array) => new TextDecoder().decode(u);

test.each([["AB", "BB8"], ["Hello!!", "%69 VD92EX0"], ["base-45", "UJCLQE7W581"], ["ietf!", "QED8WEX0"], ["", ""]])("RFC 9285: %s → %s", (claro, codificado) => {
  expect(base45Encode(b(claro))).toBe(codificado);
  expect(s(base45Decode(codificado))).toBe(claro);
});

test("ida e volta com bytes arbitrários", () => {
  const bytes = Uint8Array.from({ length: 257 }, (_, i) => (i * 37) % 256);
  expect(base45Decode(base45Encode(bytes))).toEqual(bytes);
});

test("rejeita caractere inválido", () => {
  expect(() => base45Decode("ab")).toThrow("base45 inválido");
  expect(() => base45Decode("GGW")).toThrow("base45 inválido");
});
