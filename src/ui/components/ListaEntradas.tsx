import { entradasCorrigidas } from "../../domain/entries";
import { formatarHora } from "../../domain/time";
import type { Entrada, Fuso } from "../../domain/types";
import { ROTULO_TIPO } from "../../export/rotulos";

export function ListaEntradas({ entradas, fuso, aoTocar }: { entradas: Entrada[]; fuso: Fuso; aoTocar: (e: Entrada) => void }) {
  const corrigidas = entradasCorrigidas(entradas);
  return (
    <ol className="entradas" reversed>
      {[...entradas].reverse().map((e) => {
        const classes = [`prec-${e.precedencia.toLowerCase().replace("_", "-")}`, corrigidas.has(e.seq) ? "corrigida" : ""].join(" ").trim();
        return (
          <li key={e.seq} className={classes} onClick={() => aoTocar(e)}>
            <span className="hora">{e.horaDesconhecida ? "--:--" : formatarHora(e.hora, fuso)}</span>{" "}
            <span className="seq">{`#${e.seq}`}</span>{" "}
            <strong>{e.de}</strong>{" "}
            {(e.qsa !== undefined || e.qrk !== undefined) && <span className="sinal">{e.qsa ?? "-"}/{e.qrk ?? "-"}</span>}{" "}
            <span className="tipo">{ROTULO_TIPO[e.tipo]}</span>{" "}
            {e.corrige !== undefined && <span>(corrige #{e.corrige})</span>}{" "}
            <span className="texto">{e.texto}</span>
            {corrigidas.has(e.seq) && <span className="nota">{`corrigida por #${corrigidas.get(e.seq)}`}</span>}
          </li>
        );
      })}
    </ol>
  );
}
