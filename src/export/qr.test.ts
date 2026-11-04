import { gerarBackup } from "../store/backup";
import { entrada, estacao, op } from "../test/fabrica";
import { gerarPartesQr, MontadorQr, partesParaImagens, TAMANHO_PARTE } from "./qr";

function backupGrande(n = 200) {
  const o = op({ id: "a1b2c3d4-0000-4000-8000-000000000000" });
  const es = Array.from({ length: n }, (_, i) => ({ ...entrada(o, `PU5A${String.fromCharCode(65 + (i % 26))}`, i, { texto: `Mensagem número ${i} com acentuação e ${Math.random()}` }), seq: i + 1 }));
  return gerarBackup(o, [estacao("PU5ONI")], es);
}

test("divide em partes numeradas no modo alfanumérico", () => {
  const partes = gerarPartesQr(backupGrande());
  expect(partes.length).toBeGreaterThan(1);
  partes.forEach((p, i) => {
    expect(p).toMatch(new RegExp(`^RL1/${i + 1}/${partes.length}/A1B2:`));
    expect(p).toMatch(/^[0-9A-Z $%*+\-./:]+$/);
    expect(p.length).toBeLessThanOrEqual(TAMANHO_PARTE + 20);
  });
});

test("monta fora de ordem e com repetição", () => {
  const b = backupGrande();
  const partes = gerarPartesQr(b);
  const m = new MontadorQr();
  const embaralhadas = [...partes].reverse();
  embaralhadas.splice(1, 0, partes[0]!);
  let progresso = { recebidas: 0, total: 0 };
  for (const p of embaralhadas) progresso = m.adicionar(p);
  expect(progresso).toEqual({ recebidas: partes.length, total: partes.length });
  expect(m.completo()).toBe(true);
  expect(m.resultado()).toEqual(b);
});

test("rejeita QR de outro log e QR estranho", () => {
  const m = new MontadorQr();
  m.adicionar(gerarPartesQr(backupGrande())[0]!);
  const outro = gerarBackup(op({ id: "ffff0000-0000-4000-8000-000000000000" }), [], []);
  expect(() => m.adicionar(gerarPartesQr(outro)[0]!)).toThrow("QR de outro log");
  expect(() => new MontadorQr().adicionar("https://exemplo.com")).toThrow("QR não é do RadioLog");
  expect(() => new MontadorQr().resultado()).toThrow("Faltam partes");
});

test("gera imagens PNG", async () => {
  const imgs = await partesParaImagens(gerarPartesQr(gerarBackup(op(), [], [])));
  expect(imgs).toHaveLength(1);
  expect(imgs[0]).toMatch(/^data:image\/png;base64,/);
});
