import { useEffect, useRef, useState } from "react";
import { MontadorQr } from "../../export/qr";
import type { Backup } from "../../store/backup";
import { abrirCamera } from "../camera";

interface Props {
  aoCompletar: (b: Backup) => void;
  aoCancelar: () => void;
  /** para testes: substitui a câmera */
  detectar?: () => Promise<string[]>;
  intervaloMs?: number;
}

export function LeitorQr({ aoCompletar, aoCancelar, detectar, intervaloMs = 250 }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const montador = new MontadorQr();
    let ativo = true;
    let ocupado = false;
    let fechar = () => undefined as void;
    let ler = detectar;
    const passo = async () => {
      if (!ativo || ocupado || !ler) return;
      ocupado = true;
      try {
        for (const t of await ler()) {
          const p = montador.adicionar(t);
          setProgresso(`${p.recebidas}/${p.total}`);
          setErro("");
          if (montador.completo()) {
            ativo = false;
            aoCompletar(montador.resultado());
            break;
          }
        }
      } catch (e) {
        setErro((e as Error).message);
      } finally {
        ocupado = false;
      }
    };
    if (!ler && video.current) {
      abrirCamera(video.current)
        .then((c) => { ler = c.detectar; fechar = c.fechar; })
        .catch(() => setErro("Não foi possível abrir a câmera. Verifique a permissão."));
    }
    const t = setInterval(() => void passo(), intervaloMs);
    return () => { ativo = false; clearInterval(t); fechar(); };
  }, [aoCompletar, detectar, intervaloMs]);

  return (
    <div className="leitor-qr">
      {!detectar && <video ref={video} muted />}
      <p>Aponte a câmera para os QR codes do outro aparelho, um de cada vez.</p>
      {progresso && <p className="progresso" role="status">{progresso}</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button onClick={aoCancelar}>Cancelar</button>
    </div>
  );
}
