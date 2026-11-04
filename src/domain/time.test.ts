import { formatarHora, horaDigitadaParaIso } from "./time";

const local = (s: string) => new Date(s).toISOString(); // sem sufixo = hora local (TZ America/Sao_Paulo)

test("hora digitada no mesmo dia da referência", () => {
  expect(horaDigitadaParaIso("14:05", "2026-10-31", local("2026-10-31T14:00:00"))).toBe("2026-10-31T17:05:00.000Z");
});

test("hora depois da meia-noite cai no dia seguinte", () => {
  expect(horaDigitadaParaIso("00:10", "2026-10-31", local("2026-10-31T23:50:00"))).toBe("2026-11-01T03:10:00.000Z");
});

test("hora de antes da meia-noite digitada logo depois dela cai no dia anterior", () => {
  expect(horaDigitadaParaIso("23:55", "2026-10-31", local("2026-11-01T00:05:00"))).toBe("2026-11-01T02:55:00.000Z");
});

test("sem referência usa a data da operação", () => {
  expect(horaDigitadaParaIso("9:30", "2026-10-31", "")).toBe("2026-10-31T12:30:00.000Z");
});

test("hora inválida lança erro", () => {
  expect(() => horaDigitadaParaIso("25:00", "2026-10-31", "")).toThrow("Hora inválida");
  expect(() => horaDigitadaParaIso("abc", "2026-10-31", "")).toThrow("Hora inválida");
});

test("formata no fuso local ou UTC", () => {
  expect(formatarHora("2026-10-31T17:05:00.000Z", "LOCAL")).toBe("14:05");
  expect(formatarHora("2026-10-31T17:05:00.000Z", "UTC")).toBe("17:05Z");
});
