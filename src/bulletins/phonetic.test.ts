import { falarNumero, soletrar } from "./phonetic";

test("soletra indicativos no alfabeto ICAO com dígitos em português", () => {
  expect(soletrar("PU5ONI")).toBe("Papa Uniform Cinco Oscar November India");
  expect(soletrar("py5jef/m")).toBe("Papa Yankee Cinco Juliett Echo Foxtrot Barra Mike");
  expect(soletrar("A0123456789")).toBe("Alfa Zero Um Dois Três Quatro Cinco Seis Sete Oito Nove");
});

test("fala números dígito a dígito mantendo as letras", () => {
  expect(falarNumero("REER-PR-2026-031")).toBe("REER PR Dois Zero Dois Seis Zero Três Um");
});
