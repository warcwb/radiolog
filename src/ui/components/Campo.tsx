import { useId, type ReactNode } from "react";

interface Props { rotulo: string; valor: string; aoMudar: (v: string) => void; tipo?: string; dica?: ReactNode; lista?: string }

export function Campo({ rotulo, valor, aoMudar, tipo = "text", dica, lista }: Props) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} type={tipo} value={valor} onChange={(e) => aoMudar(e.target.value)} {...(lista ? { list: lista } : {})} />
      {dica && <small>{dica}</small>}
    </div>
  );
}

interface PropsSelecao { rotulo: string; valor: string; aoMudar: (v: string) => void; opcoes: [string, string][] }

export function Selecao({ rotulo, valor, aoMudar, opcoes }: PropsSelecao) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}
