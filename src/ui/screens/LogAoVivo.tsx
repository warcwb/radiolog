import { useState } from "react";
import { alertasSemContato, lembreteIdentificacao } from "../../domain/alerts";
import { operadorAtual } from "../../domain/entries";
import { formatarHora } from "../../domain/time";
import type { Entrada, Estacao, NovaEntradaInput } from "../../domain/types";
import { ROTULO_TIPO } from "../../export/rotulos";
import { precisaLembreteBackup } from "../../store/backup";
import * as repo from "../../store/repo";
import { FaixaAlertas } from "../components/FaixaAlertas";
import { ListaEntradas } from "../components/ListaEntradas";
import { RegistroForm } from "../components/RegistroForm";
import { carregarConfig, useOperacaoAtual, type Ir } from "../state";

type Acoes = Pick<typeof repo, "acrescentarEntrada" | "acrescentarCorrecao" | "salvarEstacao">;

interface Props { id: string; ir: Ir; agoraFixo?: string; acoes?: Partial<Acoes> }

export function LogAoVivo({ id, agoraFixo, acoes = {} }: Props) {
  const a: Acoes = { ...repo, ...acoes };
  const { op, estacoes, entradas, recarregar, agora: agoraReal } = useOperacaoAtual(id);
  const [erro, setErro] = useState("");
  const [backup, setBackup] = useState(false);
  const [aberta, setAberta] = useState<Entrada | null>(null);
  const [correcao, setCorrecao] = useState<string | null>(null);
  if (!op) return <p>Carregando…</p>;
  const agora = () => agoraFixo ?? new Date().toISOString();
  const agoraTela = agoraFixo ?? agoraReal;
  const operador = operadorAtual(entradas, carregarConfig().indicativo || op.estacaoLog.indicativo);

  const registrar = async (input: NovaEntradaInput, nova?: Estacao) => {
    try {
      if (nova) await a.salvarEstacao(nova);
      await a.acrescentarEntrada(op, input, agora());
      setErro("");
      setBackup(precisaLembreteBackup(entradas.length + 1));
      await recarregar();
      return true;
    } catch (e) {
      setErro(`Não foi possível salvar: ${(e as Error).message}`);
      return false;
    }
  };

  const corrigir = async () => {
    if (!aberta || correcao === null) return;
    try {
      await a.acrescentarCorrecao(op, aberta, correcao, operador, agora());
      setAberta(null);
      setCorrecao(null);
      await recarregar();
    } catch (e) {
      setErro(`Não foi possível salvar: ${(e as Error).message}`);
    }
  };

  return (
    <section className="log-ao-vivo">
      <div className="cabecalho-op">
        <strong>{op.numero}</strong> · {op.frequencia}{op.repetidora && ` ${op.repetidora}`} · <span className="relogio">{formatarHora(agoraTela, op.fuso)}</span>
        <span> · Operador {operador}</span>
      </div>
      <FaixaAlertas alertas={alertasSemContato(op, estacoes, entradas, agoraTela)} minutosIdent={lembreteIdentificacao(op, entradas, agoraTela)} />
      {erro && <p className="erro" role="alert">{erro}</p>}
      {backup && <p className="aviso" role="status">Faça um backup (Enviar → Arquivo de backup).</p>}
      <RegistroForm op={op} estacoes={estacoes} entradas={entradas} operador={operador} agora={agora} aoRegistrar={registrar} />
      {aberta && (
        <div className="detalhe" role="dialog" aria-label={`Entrada #${aberta.seq}`}>
          <p><strong>#{aberta.seq}</strong> {formatarHora(aberta.hora, op.fuso)} · {ROTULO_TIPO[aberta.tipo]} · {aberta.de} → {aberta.para} · {aberta.texto}</p>
          {correcao === null ? (
            <div className="acoes">
              <button onClick={() => setCorrecao("")}>Corrigir</button>
              <button onClick={() => setAberta(null)}>Fechar</button>
            </div>
          ) : (
            <>
              <div className="campo">
                <label htmlFor="rl-corr">Texto da correção</label>
                <input id="rl-corr" value={correcao} onChange={(e) => setCorrecao(e.target.value)} />
              </div>
              <button className="primario" onClick={() => void corrigir()}>Confirmar correção</button>
            </>
          )}
        </div>
      )}
      <ListaEntradas entradas={entradas} fuso={op.fuso} aoTocar={(e) => { setAberta(e); setCorrecao(null); }} />
    </section>
  );
}
