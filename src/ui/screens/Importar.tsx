import { useState } from "react";
import { novaOperacao } from "../../domain/operation";
import type { ImportPreview } from "../../import/preview";
import { aplicarImportacao } from "../../import/preview";
import { lerArquivoTexto } from "../../import/readText";
import { interpretarTxtColega } from "../../import/txtColega";
import { ehTxtNativo, interpretarTxtNativo } from "../../import/txtNativo";
import { lerBackup, type Backup } from "../../store/backup";
import { carregarOperacao } from "../../store/repo";
import { LeitorQr } from "../components/LeitorQr";
import { carregarConfig, type Ir } from "../state";

function deBackup(b: Backup): ImportPreview {
  const entradas = b.entradas.map(({ operacaoId: _, ...e }) => e);
  return {
    operacao: b.operacao, estacoes: b.estacoes, entradas, pendenciasSugeridas: [],
    linhas: [{ numero: 0, original: "Backup do RadioLog", status: "OK", avisos: [] }, ...entradas.map((e, i) => ({ numero: i + 1, original: `#${e.seq} ${e.de} ${e.texto}`, status: "OK" as const, avisos: [], entradaIndice: i }))],
  };
}

function interpretar(texto: string): ImportPreview | null {
  try {
    if (texto.trimStart().startsWith("{")) return deBackup(lerBackup(texto));
    if (ehTxtNativo(texto)) return interpretarTxtNativo(texto);
    const p = interpretarTxtColega(texto, carregarConfig().indicativo);
    return p.entradas.length ? p : null;
  } catch {
    return null;
  }
}

export function Importar({ ir }: { ir: Ir }) {
  const [prev, setPrev] = useState<ImportPreview | null>(null);
  const [erro, setErro] = useState("");
  const [duplicada, setDuplicada] = useState(false);
  const [lendoQr, setLendoQr] = useState(false);

  const preparar = async (p: ImportPreview | null) => {
    setDuplicada(false);
    setPrev(p);
    setErro(p ? "" : "Arquivo não reconhecido");
    if (p?.operacao.id && (await carregarOperacao(p.operacao.id))) setDuplicada(true);
  };
  const escolher = async (f: File | undefined) => {
    if (f) await preparar(interpretar(await lerArquivoTexto(f)));
  };
  const confirmar = async (comoCopia: boolean) => {
    if (!prev) return;
    const id = comoCopia || !prev.operacao.id ? crypto.randomUUID() : prev.operacao.id;
    const base = novaOperacao({ nome: prev.operacao.nome ?? "Log importado" }, prev.operacao.inicio ?? new Date().toISOString(), id);
    const op = await aplicarImportacao(prev, base);
    ir({ nome: "log", id: op.id });
  };

  return (
    <section>
      <h2>Importar log</h2>
      <div className="campo">
        <label htmlFor="rl-arq">Arquivo do log</label>
        <input id="rl-arq" type="file" accept=".txt,.json,text/plain,application/json" onChange={(e) => void escolher(e.target.files?.[0])} />
        <small>Aceita o .txt de outros radioamadores, o TXT do RadioLog e o backup (.json).</small>
      </div>
      <button onClick={() => setLendoQr(true)}>Ler QR code de outro aparelho</button>
      {lendoQr && <LeitorQr aoCompletar={(b) => { setLendoQr(false); void preparar(deBackup(b)); }} aoCancelar={() => setLendoQr(false)} />}
      {erro && <p className="erro" role="alert">{erro}</p>}
      {prev && (
        <>
          <p>{prev.linhas.length} linhas</p>
          <ul className="previa">
            {prev.linhas.map((l) => (
              <li key={l.numero} data-linha={l.numero} className={`status-${l.status === "OK" ? "ok" : l.status === "AVISO" ? "aviso" : "nao-reconhecida"}`}>
                <code>{l.numero ? `${l.numero}: ` : ""}{l.original.trim()}</code>
                {l.avisos.map((a) => <div key={a.codigo} className="aviso-linha">⚠ {a.texto}</div>)}
              </li>
            ))}
          </ul>
          {duplicada ? (
            <div className="acoes" role="alert">
              <p>Esta operação já existe. Importar como cópia?</p>
              <button className="primario" onClick={() => void confirmar(true)}>Importar como cópia</button>
              <button onClick={() => setPrev(null)}>Cancelar</button>
            </div>
          ) : (
            <button className="primario" onClick={() => void confirmar(false)}>Confirmar importação</button>
          )}
        </>
      )}
    </section>
  );
}
