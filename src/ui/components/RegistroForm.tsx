import { useState, type KeyboardEvent } from "react";
import { indicativoEstrangeiro, indicativoValido, normalizarIndicativo } from "../../domain/callsign";
import { horaDigitadaParaIso } from "../../domain/time";
import type { Entrada, Estacao, Funcao, NovaEntradaInput, Operacao, Precedencia, TipoEntrada } from "../../domain/types";
import { ROTULO_TIPO } from "../../export/rotulos";
import { Campo, Selecao } from "./Campo";

const PRINCIPAIS: [TipoEntrada, string][] = [["ENTRADA_REDE", "ENTRADA"], ["SITUACAO", "SITUAÇÃO"], ["TRAFEGO", "TRÁFEGO"], ["SAIDA", "SAÍDA"]];
const OUTROS: TipoEntrada[] = ["MENSAGEM_FORMAL", "TROCA_OPERADOR", "OBSERVACAO", "IDENTIFICACAO", "NAO_IDENTIFICADA"];
const DE_ESTACAO = new Set<TipoEntrada>(["ENTRADA_REDE", "SITUACAO", "TRAFEGO", "SAIDA", "MENSAGEM_FORMAL"]);

export const chaveDe = (s: string) => (indicativoValido(s) || indicativoEstrangeiro(s) ? normalizarIndicativo(s) : s.trim().toUpperCase());

interface Props {
  op: Operacao;
  estacoes: Estacao[];
  entradas: Entrada[];
  operador: string;
  agora: () => string;
  /** devolve true se gravou */
  aoRegistrar: (input: NovaEntradaInput, estacaoNova?: Estacao) => Promise<boolean>;
}

type Speech = new () => { lang: string; onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void; start: () => void };

export function RegistroForm({ op, estacoes, entradas, operador, agora, aoRegistrar }: Props) {
  const [ind, setInd] = useState("");
  const [qsa, setQsa] = useState<number | undefined>();
  const [qrk, setQrk] = useState<number | undefined>();
  const [tipo, setTipo] = useState<TipoEntrada>("SITUACAO");
  const [texto, setTexto] = useState("");
  const [hora, setHora] = useState("");
  const [prec, setPrec] = useState<Precedencia>("ROTINA");
  const [numMsg, setNumMsg] = useState("");
  const [local, setLocal] = useState("");
  const [mais, setMais] = useState(false);
  const [erro, setErro] = useState("");
  const [cadastro, setCadastro] = useState<Estacao | null>(null);
  const encerrada = op.status === "ENCERRADA";

  const termo = chaveDe(ind);
  const sugestoes = termo ? estacoes.filter((e) => (e.chave.startsWith(termo) || e.tatico.toUpperCase().startsWith(termo)) && e.chave !== termo).slice(0, 5) : [];

  const escolher = (e: Estacao) => {
    setInd(e.chave);
    const ultima = [...entradas].reverse().find((x) => x.de === e.chave && x.qsa !== undefined);
    setQsa(ultima?.qsa);
    setQrk(ultima?.qrk);
    setTipo(entradas.some((x) => x.de === e.chave) ? "SITUACAO" : "ENTRADA_REDE");
  };

  const limpar = () => {
    setInd(""); setQsa(undefined); setQrk(undefined); setTipo("SITUACAO"); setTexto(""); setHora("");
    setPrec("ROTINA"); setNumMsg(""); setLocal(""); setMais(false); setErro(""); setCadastro(null);
  };

  const enviar = async (t: TipoEntrada, de: string, nova?: Estacao) => {
    let h: string;
    try {
      h = hora.trim() ? horaDigitadaParaIso(hora, op.data, agora()) : agora();
    } catch (e) {
      setErro((e as Error).message);
      return;
    }
    const input: NovaEntradaInput = {
      hora: h, operador, tipo: t, de, texto, local, precedencia: prec, numMensagem: numMsg,
      ...(qsa !== undefined ? { qsa } : {}), ...(qrk !== undefined ? { qrk } : {}),
    };
    if (await aoRegistrar(input, nova)) limpar();
  };

  const registrar = async () => {
    setErro("");
    if (!termo) return setErro("Informe o indicativo");
    if (DE_ESTACAO.has(tipo) && !estacoes.some((e) => e.chave === termo)) {
      const valido = indicativoValido(ind) || indicativoEstrangeiro(ind);
      setCadastro({ operacaoId: op.id, chave: termo, indicativo: valido ? termo : "", tatico: valido ? "" : ind.trim(), nome: "", equipamento: "", local, grid: "", funcao: "FIXA" });
      return;
    }
    await enviar(tipo, termo);
  };

  const enter = (e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); void (encerrada ? enviar("OBSERVACAO", "") : registrar()); } };
  const Rec = (window as unknown as { SpeechRecognition?: Speech; webkitSpeechRecognition?: Speech }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: Speech }).webkitSpeechRecognition;
  const ditar = () => {
    if (!Rec) return;
    const r = new Rec();
    r.lang = "pt-BR";
    r.onresult = (ev) => setTexto((t) => `${t} ${ev.results[0][0].transcript}`.trim());
    r.start();
  };

  const campoTexto = (
    <div className="campo">
      <label htmlFor="rl-texto">Texto</label>
      <div className="linha">
        <input id="rl-texto" lang="pt-BR" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={enter} />
        {Rec && <button type="button" onClick={ditar} aria-label="Ditar">🎤</button>}
      </div>
      <small>O ditado do teclado do celular funciona offline.</small>
    </div>
  );

  if (encerrada) {
    return (
      <form className="registro" onSubmit={(e) => e.preventDefault()}>
        <p>Operação encerrada: só é possível registrar observações e correções.</p>
        {campoTexto}
        <button className="primario" type="button" onClick={() => void enviar("OBSERVACAO", "")}>Registrar observação</button>
      </form>
    );
  }

  const nota = (rotulo: string, valor: number | undefined, set: (v: number | undefined) => void) => (
    <div className="notas" role="group" aria-label={rotulo}>
      {[5, 4, 3, 2, 1].map((n) => (
        <button key={n} type="button" aria-pressed={valor === n} aria-label={`${rotulo} ${n}`} onClick={() => set(valor === n ? undefined : n)}>{n}</button>
      ))}
    </div>
  );

  return (
    <form className="registro" onSubmit={(e) => e.preventDefault()}>
      <div className="campo">
        <label htmlFor="rl-ind">Indicativo</label>
        <input id="rl-ind" autoComplete="off" autoCapitalize="characters" value={ind} onChange={(e) => setInd(e.target.value)} onKeyDown={enter} />
        {sugestoes.length > 0 && (
          <div className="sugestoes">{sugestoes.map((e) => <button key={e.chave} type="button" onClick={() => escolher(e)}>{e.chave}</button>)}</div>
        )}
      </div>
      {nota("QSA", qsa, setQsa)}
      {nota("QRK", qrk, setQrk)}
      <div className="tipos">
        {PRINCIPAIS.map(([t, r]) => <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)}>{r}</button>)}
        <button type="button" aria-expanded={mais} onClick={() => setMais(!mais)}>Mais opções</button>
      </div>
      {mais && (
        <div className="mais">
          <Selecao rotulo="Outro tipo" valor={OUTROS.includes(tipo) ? tipo : ""} aoMudar={(v) => v && setTipo(v as TipoEntrada)} opcoes={[["", "—"], ...OUTROS.map((t): [string, string] => [t, ROTULO_TIPO[t]])]} />
          <Selecao rotulo="Precedência" valor={prec} aoMudar={(v) => setPrec(v as Precedencia)} opcoes={[["ROTINA", "Rotina"], ["BEM_ESTAR", "Bem-estar"], ["PRIORIDADE", "Prioridade"], ["EMERGENCIA", "EMERGÊNCIA"]]} />
          <Campo rotulo="Nº da mensagem" valor={numMsg} aoMudar={setNumMsg} />
          <Campo rotulo="Local" valor={local} aoMudar={setLocal} />
        </div>
      )}
      <Campo rotulo="Hora" valor={hora} aoMudar={setHora} dica="Vazio = agora. Para registro atrasado: HH:MM" />
      {campoTexto}
      {cadastro && <MiniCadastro estacao={cadastro} aoSalvar={(e) => void enviar(tipo === "SITUACAO" ? "ENTRADA_REDE" : tipo, e.chave, e)} aoCancelar={() => setCadastro(null)} />}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="acoes">
        <button className="primario registrar" type="button" onClick={() => void registrar()}>REGISTRAR</button>
        <button type="button" onClick={() => void enviar("IDENTIFICACAO", op.estacaoLog.indicativo || operador)}>IDENT</button>
        <button type="button" onClick={() => void enviar("NAO_IDENTIFICADA", ind.trim() || "?")}>Não identificada (?)</button>
      </div>
    </form>
  );
}

function MiniCadastro({ estacao, aoSalvar, aoCancelar }: { estacao: Estacao; aoSalvar: (e: Estacao) => void; aoCancelar: () => void }) {
  const [e, setE] = useState(estacao);
  const mudar = (k: keyof Estacao) => (v: string) => setE((x) => ({ ...x, [k]: v }));
  return (
    <fieldset className="mini-cadastro" role="group" aria-label={`Nova estação ${estacao.chave}`}>
      <legend>Nova estação {estacao.chave}</legend>
      <Campo rotulo="Nome" valor={e.nome} aoMudar={mudar("nome")} />
      <Campo rotulo="Indicativo tático" valor={e.tatico} aoMudar={mudar("tatico")} />
      <Campo rotulo="Local" valor={e.local} aoMudar={mudar("local")} />
      <Campo rotulo="Equipamento" valor={e.equipamento} aoMudar={mudar("equipamento")} />
      <Selecao rotulo="Função" valor={e.funcao} aoMudar={(v) => setE((x) => ({ ...x, funcao: v as Funcao }))} opcoes={[["FIXA", "Fixa"], ["BASE", "Base"], ["CAMPO", "Campo"], ["MOVEL", "Móvel"]]} />
      <div className="acoes">
        <button className="primario" type="button" onClick={() => aoSalvar(e)}>Salvar estação e registrar</button>
        <button type="button" onClick={aoCancelar}>Cancelar</button>
      </div>
    </fieldset>
  );
}
