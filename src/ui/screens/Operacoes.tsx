import { useEffect, useState } from "react";
import type { Operacao } from "../../domain/types";
import { listarOperacoes } from "../../store/repo";
import type { Ir } from "../state";

function Item({ o, ir }: { o: Operacao; ir: Ir }) {
  return (
    <li>
      <button className="item-operacao" onClick={() => ir({ nome: "log", id: o.id })}>
        <strong>{o.nome || "(sem nome)"}</strong> <span>{o.numero} · {o.data} · {o.frequencia}</span>
      </button>
    </li>
  );
}

export function Operacoes({ ir }: { ir: Ir }) {
  const [ops, setOps] = useState<Operacao[] | null>(null);
  useEffect(() => { void listarOperacoes().then(setOps); }, []);
  const abertas = ops?.filter((o) => o.status === "ABERTA") ?? [];
  const encerradas = ops?.filter((o) => o.status === "ENCERRADA") ?? [];
  return (
    <section>
      <div className="acoes">
        <button className="primario" onClick={() => ir({ nome: "nova" })}>Nova operação</button>
        <button onClick={() => ir({ nome: "importar" })}>Importar log</button>
      </div>
      {ops && !ops.length && <p>Nenhuma operação ainda. Toque em “Nova operação” para começar a registrar uma rede.</p>}
      {abertas.length > 0 && <><h2>Abertas</h2><ul className="lista">{abertas.map((o) => <Item key={o.id} o={o} ir={ir} />)}</ul></>}
      {encerradas.length > 0 && <><h2>Encerradas</h2><ul className="lista">{encerradas.map((o) => <Item key={o.id} o={o} ir={ir} />)}</ul></>}
    </section>
  );
}
