import type { Alerta } from "../../domain/alerts";

export function FaixaAlertas({ alertas, minutosIdent }: { alertas: Alerta[]; minutosIdent: number | null }) {
  if (!alertas.length && minutosIdent === null) return null;
  return (
    <div className="faixa-alertas" role="alert">
      {alertas.map((a) => <p key={a.chave}>{a.chave} sem contato há {a.minutos} min</p>)}
      {minutosIdent !== null && <p>Identifique a estação ({minutosIdent} min)</p>}
    </div>
  );
}
