import { situacaoEstacoes, type SituacaoEstacao } from "../../domain/stations";
import { formatarHora } from "../../domain/time";
import type { Funcao, Operacao } from "../../domain/types";
import { salvarEstacao } from "../../store/repo";
import { useOperacaoAtual } from "../state";

const rotulo = (s: SituacaoEstacao) =>
  s.situacao === "SAIDA" ? "Saiu" : s.situacao === "SEM_CONTATO" ? `Sem contato (${s.minutosSemContato} min)` : "Ativa";

export function Estacoes({ id, agoraFixo }: { id: string; agoraFixo?: string }) {
  const { op, estacoes, entradas, recarregar, agora } = useOperacaoAtual(id);
  if (!op) return <p>Carregando…</p>;
  const lista = situacaoEstacoes(op as Operacao, estacoes, entradas, agoraFixo ?? agora);
  const mudarFuncao = async (s: SituacaoEstacao, funcao: Funcao) => {
    await salvarEstacao({ ...s.estacao, funcao });
    await recarregar();
  };
  return (
    <section>
      <h2>Estações ({lista.length})</h2>
      <table className="tabela-estacoes">
        <thead><tr><th>Estação</th><th>Situação</th><th>Último contato</th><th>Local</th><th>Sinal</th><th>Função</th></tr></thead>
        <tbody>
          {lista.map((s) => (
            <tr key={s.estacao.chave} className={`sit-${s.situacao.toLowerCase()}`}>
              <td>{s.estacao.chave}</td>
              <td>{rotulo(s)}</td>
              <td>{s.ultimaHora ? formatarHora(s.ultimaHora, op.fuso) : "—"}</td>
              <td>{s.ultimoLocal}</td>
              <td>{s.ultimoQsa !== undefined || s.ultimoQrk !== undefined ? `${s.ultimoQsa ?? "-"}/${s.ultimoQrk ?? "-"}` : ""}</td>
              <td>
                <select aria-label={`Função de ${s.estacao.chave}`} value={s.estacao.funcao} onChange={(e) => void mudarFuncao(s, e.target.value as Funcao)}>
                  <option value="FIXA">Fixa</option><option value="BASE">Base</option><option value="CAMPO">Campo</option><option value="MOVEL">Móvel</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
