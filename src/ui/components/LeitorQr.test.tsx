import { render, screen } from "@testing-library/react";
import { gerarPartesQr } from "../../export/qr";
import { gerarBackup } from "../../store/backup";
import { entrada, op } from "../../test/fabrica";
import { LeitorQr } from "./LeitorQr";

function partes() {
  const o = op({ id: "abcd0000-0000-4000-8000-000000000000" });
  const es = Array.from({ length: 120 }, (_, i) => ({ ...entrada(o, "PU5ONI", i, { texto: `linha ${(i * 7919) % 10007}` }), seq: i + 1 }));
  const b = gerarBackup(o, [], es);
  return { b, p: gerarPartesQr(b) };
}

test("mostra progresso e entrega o backup completo", async () => {
  const { b, p } = partes();
  expect(p.length).toBeGreaterThanOrEqual(3);
  const fila = [[p[0]!], [], [p[0]!, p[1]!], p.slice(2)];
  const aoCompletar = vi.fn();
  render(<LeitorQr aoCompletar={aoCompletar} aoCancelar={vi.fn()} detectar={async () => fila.shift() ?? []} intervaloMs={10} />);
  expect(await screen.findByText(`2/${p.length}`)).toBeInTheDocument();
  await vi.waitFor(() => expect(aoCompletar).toHaveBeenCalledWith(b));
});

test("erro de leitura aparece para o usuário", async () => {
  render(<LeitorQr aoCompletar={vi.fn()} aoCancelar={vi.fn()} detectar={async () => ["https://exemplo.com"]} intervaloMs={10} />);
  expect(await screen.findByText("QR não é do RadioLog")).toBeInTheDocument();
});
