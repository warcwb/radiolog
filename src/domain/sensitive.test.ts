import { detectarSensivel } from "./sensitive";

test.each(["vítima no km 2", "Ferido leve", "óbito", "desaparecido", "tel (41) 99876-5432", "CPF 123.456.789-09", "Hospitalizada"])("sensível: %s", (t) => {
  expect(detectarSensivel(t)).toBe(true);
});

test.each(["Deslocamento BaseCOSMO-Prainha", "145.210MHz", "14:30", "QSA-5 QRK-5", ""])("não sensível: %s", (t) => {
  expect(detectarSensivel(t)).toBe(false);
});
