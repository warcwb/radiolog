# RadioLog – Sistema de Log de Comunicações de Rádio Emergência

**Data:** 2026-11-03 · **Status:** em revisão pelo usuário · **Versão do documento:** 1

## 1. Objetivo

Registrar, de forma confiável e rápida, as comunicações de redes de rádio de emergência operadas por radioamadores (REER-PR / RENER / LABRE) em apoio à Defesa Civil e a eventos. O log precisa responder, ao final de qualquer operação: **quem estava onde, o que foi comunicado e se todos encerraram em segurança**. Também precisa permitir enviar resumos e o próprio log pelos meios de rádio que o grupo usa.

### Usuários e contexto
- Operador de rede (NCS, adjunto ou anotador) numa estação fixa ou móvel, ouvindo o rádio e registrando em tempo real.
- Equipamento em campo: rádios VHF/UHF; alguns membros com APRS; quase todos com SSTV.
- Sem internet garantida.

### O que o usuário pediu (confirmado)
- (A) registro em tempo real no computador, possivelmente offline;
- (B) registro no celular;
- (C) importar registros feitos em papel ou .txt (formato do log de exemplo em `docs/referencias/exemplo-log-colega-2026-10-31.txt`);
- envio pelos meios disponíveis, com prioridade para SSTV, depois APRS e voz.

### Fora do escopo da v1
- (D) vários operadores registrando ao mesmo tempo, com sincronização automática;
- Winlink, fldigi, flmsg e flamp (ficam como extensões futuras);
- leitura automática de posições APRS;
- servidor ou contas de usuário.

### Critérios de sucesso
1. Uma chamada comum (estação já conhecida) é registrada com no máximo 2 toques mais o texto opcional.
2. O app funciona sem nenhuma conexão depois do primeiro acesso, em Chrome (Android e Windows) e Safari (iOS).
3. O log de exemplo do colega é importado sem perda de linhas, e todo trecho duvidoso é sinalizado.
4. O sistema gera um ICS 309 em PDF, CSV, TXT reimportável, QR code e boletins SSTV, APRS e de voz.
5. Nenhum registro é apagado ou alterado sem deixar rastro.
6. Nenhuma operação é encerrada com equipe de campo sem saída registrada, a menos que o operador justifique.

## 2. Referências de padrão

Base dos campos: ICS 309 (FEMA/NIMS), IARU HF International Emergency Operating Procedure (adotado pelas 3 Regiões), ARRL Radiogram/NTS, formulários RAYNET e WICEN e a prática da RENER.

A leitura dos documentos originais está pendente, porque os sites estavam bloqueados nesta sessão (ver `docs/referencias/handoff-sistema-log-radio-emergencia.md`). Ajustes de campos que vierem dessa leitura entram como revisão desta spec.

Também não foi verificado se a Anatel tem regras sobre log ou intervalo de identificação (Ato 3448/2026). O sistema não impõe intervalo de identificação; apenas oferece um lembrete configurável (desligado por padrão).

## 3. Arquitetura

- **Tipo:** PWA (aplicativo web instalável), estático, sem servidor. Um *service worker* guarda todos os arquivos do app em cache para uso offline.
- **Tecnologia:** TypeScript estrito, Vite e React 18 (mesma base do frontend do RadioForge, neste mesmo repositório).
  - Dados: IndexedDB via Dexie.
  - PDF: jsPDF.
  - QR: `qrcode` para gerar, `BarcodeDetector` nativo com `jsQR` de reserva para ler.
  - Compressão: `fflate`.
  - Testes: Vitest (unidade) e Playwright (ponta a ponta).
- **Local no repositório:** pasta `radiolog/` do RadioForge, como projeto independente (não usa o backend Python, porque precisa rodar no celular sem nada instalado).
- **Hospedagem:** qualquer servidor estático (por exemplo GitHub Pages). Também pode ser aberto a partir de um arquivo ZIP local com `npx serve`.
- **Módulos** (cada um com interface própria e testável isoladamente):

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `domain/` | Tipos e regras: criar entrada, corrigir, calcular situação das estações, alertas, validação do encerramento | nada (TypeScript puro) |
| `store/` | Persistência no IndexedDB e backup em JSON | `domain` |
| `import/` | Interpretar o .txt e devolver uma prévia com avisos | `domain` |
| `export/` | TXT, CSV, ICS 309 em PDF, JSON e QR | `domain` |
| `bulletins/` | Imagem SSTV em PNG, mensagens APRS, roteiro de voz | `domain` |
| `ui/` | Telas | todos |

Os módulos `import`, `export` e `bulletins` só **leem** o modelo; quem grava é exclusivamente o `domain` via `store`. Um meio de envio novo (por exemplo Winlink) entra como um módulo novo em `bulletins/` ou `export/`, sem mudar o registro.

## 4. Modelo de dados

### 4.1 Operação
| Campo | Tipo | Obs. |
|---|---|---|
| id | UUID | |
| nome | texto | ex. "Apoio travessia Parque X" |
| numero | texto | ex. "REER-PR-2026-031"; sugerido automaticamente (sigla-ano-sequência) |
| tipo | REAL \| EXERCICIO \| EVENTO | EXERCICIO marca todas as mensagens como TESTE |
| orgaoApoiado | texto | |
| data, inicio, fim | data/hora | fim é preenchido no encerramento |
| fuso | LOCAL \| UTC | LOCAL = fuso do aparelho (por exemplo UTC-3); exibido em todos os documentos |
| rede, frequencia, repetidora, offset, tom, modo | texto | modo: FM, C4FM, DMR, D-STAR, SSB, outro |
| ncs, adjunto, anotador | {indicativo, nome} | |
| estacaoLog | {indicativo, equipamento, potencia, antena, grid} | |
| status | ABERTA \| ENCERRADA | |
| encerramento | ver 4.4 | |

### 4.2 Estação (cadastrada dentro de cada operação)
| Campo | Tipo |
|---|---|
| indicativo | texto (oficial); vazio para estação somente tática |
| tatico | texto (ex. "Equipe 1", "BaseCOSMO") |
| nome, equipamento, local, grid | texto |
| funcao | CAMPO \| BASE \| FIXA \| MOVEL |

A **situação** da estação (ATIVA, SAIDA, SEM_CONTATO), a última vez em que foi ouvida, o último local e o último sinal **são calculados** a partir das entradas, e nunca gravados.

### 4.3 Entrada
| Campo | Tipo | Obs. |
|---|---|---|
| seq | inteiro | sequencial por operação, começando em 1 |
| hora | data/hora | automática e ajustável; `horaRegistro` guarda o momento real do registro |
| horaDesconhecida | booleano | para observações importadas sem hora |
| operador | indicativo | quem registrou |
| tipo | ENTRADA_REDE \| SAIDA \| TRAFEGO \| SITUACAO \| MENSAGEM_FORMAL \| IDENTIFICACAO \| NAO_IDENTIFICADA \| CORRECAO \| OBSERVACAO \| TROCA_OPERADOR | |
| de, para | referência a uma estação ou texto livre | "para" usa a NCS por padrão |
| qsa, qrk | 1–5, opcionais | |
| local, grid | texto | |
| precedencia | EMERGENCIA \| PRIORIDADE \| BEM_ESTAR \| ROTINA | ROTINA por padrão |
| teste | booleano | verdadeiro para toda a operação quando o tipo for EXERCICIO |
| numMensagem | texto | gerado para MENSAGEM_FORMAL e TRAFEGO numerado |
| texto | texto | |
| sensivel | booleano | |
| corrige | seq da entrada corrigida | só no tipo CORRECAO |
| origem | DIGITADO \| IMPORTADO | |

### 4.4 Encerramento
hora, total de estações (calculado), lista de pendências (texto mais estação), justificativa (obrigatória se houver equipe de campo sem SAIDA), responsável e a quem o log foi entregue.

### 4.5 Regras de negócio
1. **Somente acréscimo.** Entradas não são editadas nem apagadas. Uma CORRECAO aponta para a entrada original, que passa a ser exibida riscada com "corrigida por #n". Exportações mostram a original e a correção.
2. **Operação encerrada** só aceita CORRECAO e OBSERVACAO, ambas marcadas "pós-encerramento".
3. **Sem contato:** uma estação de função CAMPO ou MOVEL que não foi ouvida por mais de X minutos (padrão 30, configurável por operação) e não tem SAIDA gera alerta. O alerta some quando chega uma nova entrada da estação.
4. **Encerramento** é bloqueado enquanto houver estação CAMPO ou MOVEL sem SAIDA, a menos que o operador escreva uma justificativa, que vai para o log.
5. **Dados sensíveis:** o campo `sensivel` vem marcado automaticamente quando o texto contém nome de pessoa atendida, telefone, CPF ou termos como "vítima", "ferido", "óbito" ou "desaparecido". O operador pode desmarcar. Entradas sensíveis são ocultadas nos boletins de rádio (SSTV, APRS, voz) e mantidas nos arquivos (PDF, CSV, TXT, JSON).
6. **Troca de operador** é uma entrada do tipo TROCA_OPERADOR. O campo `operador` das entradas seguintes passa a ser o novo operador.
7. **Lembrete de identificação** (opcional, desligado por padrão): avisa quando a estação do log fica mais de N minutos sem uma IDENTIFICACAO.

## 5. Telas

1. **Operações:** lista com abertas e encerradas, "Nova operação" e "Copiar configuração de operação anterior".
2. **Log ao vivo** (tela principal):
   - cabeçalho fixo com número, frequência, repetidora e relógio;
   - faixa de alertas de sem contato;
   - lista de entradas, a mais recente no topo;
   - formulário de registro:
     - indicativo com autocompletar; uma estação nova abre um mini cadastro;
     - botões grandes 1–5 para QSA e QRK;
     - botões de tipo;
     - texto, com ditado;
     - botão REGISTRAR.
   - Atalhos e comportamentos:
     - **"?"** registra uma NAO_IDENTIFICADA;
     - **"IDENT"** registra uma IDENTIFICACAO com um toque;
     - ao selecionar uma estação conhecida, QSA e QRK repetem os da última entrada dela, e o tipo vem como SITUACAO;
     - EMERGENCIA aparece em vermelho e PRIORIDADE em laranja.
   - Tocar numa entrada abre os detalhes e o botão **Corrigir**.
   - No computador, Enter registra e há atalhos de teclado para os tipos.
3. **Estações:** quadro de situação; as estações CAMPO e MOVEL ficam no topo, ordenadas pelo tempo sem contato.
4. **Enviar:** SSTV, APRS, Roteiro de voz, QR/arquivo e ICS 309 em PDF. Cada opção mostra uma prévia e avisa quando há entradas sensíveis ocultadas.
5. **Encerramento:** checklist, pendências, justificativa e o botão Encerrar, que oferece gerar o ICS 309 e o boletim final.
6. **Importar:** escolher o arquivo e ver a prévia linha a linha em verde (reconhecida), amarelo (aviso) ou vermelho (não reconhecida, vira OBSERVACAO). O operador confirma antes de importar.
7. **Configurações:** indicativo e dados padrão do operador, minutos para sem contato, lembrete de identificação, modo SSTV padrão, tema (claro, escuro, noturno em vermelho) e tamanho de fonte.

**Ditado:** o ditado do teclado do sistema (Gboard, teclado do iOS) é o caminho principal, porque funciona offline com o pacote de idioma pt-BR baixado. O botão de microfone usa a Web Speech API quando disponível, e o app avisa que ela pode precisar de internet. **O ditado deve ser validado em teste de campo**, com o rádio ligado ao lado.

## 6. Importação de .txt

Exemplo de referência: `docs/referencias/exemplo-log-colega-2026-10-31.txt`.

| Padrão | Resultado |
|---|---|
| `LOG QRG145.210MHz` | operação.frequencia = 145.210 MHz |
| `2026.10.31` (também `31/10/2026`, `2026-10-31`) | operação.data |
| `Disponibilidade: Das 14:00hrs às 16:00hrs` | inicio e fim |
| `GridLocator: GG54jm` | estacaoLog.grid |
| linhas de equipamento antes da primeira entrada | estacaoLog.equipamento |
| `Adjunto PU5NOC - 1ªReg. REER-PR` | adjunto e rede |
| `HH:MM INDICATIVO [QSA-x QRK-y] [- Nome] [- texto]` | entrada; o nome preenche o cadastro da estação |
| linha da estação do log com "Em QRV" | IDENTIFICACAO |
| primeira linha de uma estação | ENTRADA_REDE; as seguintes, SITUACAO |
| indicativo com `?` ou só `?????` | NAO_IDENTIFICADA |
| `HH:MM Palavra` sem indicativo válido (ex. `BaseCosmo`) | estação somente tática |
| linhas `- texto` sem hora | OBSERVACAO com horaDesconhecida |
| `Via PY5CTV(ARPA) 145.210MHz` | repetidora |

Indicativo válido: regex de prefixos brasileiros (PP–PY, ZV–ZZ), mais um dígito e um sufixo de 1 a 3 letras. Indicativos estrangeiros são aceitos com aviso.

**Avisos:**
- indicativos que diferem em um só caractere (PU5JEF/PY5JEF);
- estação de campo sem saída no fim do arquivo;
- frases de segurança ambíguas ("a maioria", "quase todos", "maior parte"), que viram sugestão de pendência;
- hora fora do período;
- hora anterior à da linha de cima.

O TXT exportado pelo próprio sistema também é reimportável sem perda.

## 7. Exportações

- **TXT:** cabeçalho, entradas no formato `HH:MM #seq TIPO DE→PARA QSA/QRK local | texto` e encerramento.
- **CSV:** UTF-8 com BOM (para abrir direto no Excel), separador `;`, uma linha por entrada com todos os campos.
- **ICS 309 em PDF** (A4):
  - cabeçalho: incidente, período, rede, frequência, operador e indicativo;
  - tabela Hora/De/Para/Mensagem, com nº da mensagem e precedência quando houver;
  - "Página X de Y";
  - rodapé com o responsável e o campo de assinatura.
- **JSON:** backup completo da operação, que também serve para importar em outro aparelho.
- **QR:** o JSON é comprimido (`fflate`) e codificado em base45. Se não couber num QR só, vira uma sequência "RL1/n:…". O leitor junta as partes, mostra o progresso (3/5) e importa.

## 8. Boletins

### 8.1 SSTV (PNG)
- **Modos e tamanhos:** Robot36 (320×240, padrão), Martin M1 (320×256), Scottie S1 (320×256), PD120 (640×496).
- **Modelos:** Situação geral, Equipes em campo, Pendências/alertas, Encerramento.
- **Layout:**
  - faixa superior com indicativo da estação, número da operação, hora e "pág. n/N";
  - corpo com, no máximo, 6 linhas de cerca de 24 caracteres nos modos de 320 px (12 linhas no PD120);
  - fonte sem serifa em negrito, texto branco sobre fundo escuro, EMERGÊNCIA em fundo vermelho.
- **Paginação automática.** Entradas sensíveis aparecem como "[dado reservado]".
- **Fase 2 (fora da v1):** gerar o áudio SSTV no próprio app.

### 8.2 APRS
Mensagens de até 67 caracteres, em maiúsculas, sem acentos, no formato `OP<num> <INDICATIVO> <STATUS> <LOCAL> <HHMM>`. Textos longos são divididos em partes numeradas "1/2". Cada mensagem tem um botão de copiar.

### 8.3 Voz
Roteiro em texto com:
- abertura ("Aqui PU5NOC, boletim da operação…");
- indicativos soletrados no alfabeto fonético internacional (Papa Uniform Cinco…);
- números ditos dígito a dígito;
- encerramento.

## 9. Tratamento de erros

- Cada entrada é gravada no IndexedDB antes de aparecer na lista. Se a gravação falhar, aparece um aviso vermelho e o texto digitado é mantido.
- O app pede armazenamento persistente (`navigator.storage.persist()`) e avisa se for negado.
- Lembrete de backup a cada 30 entradas ou no encerramento.
- Aviso de pouco espaço quando a cota de armazenamento passar de 80%.
- Falha ao gerar PDF ou QR: mostra o motivo e oferece outro formato.
- Importação: nenhum dado é gravado antes da confirmação; linhas não reconhecidas nunca são descartadas e viram OBSERVACAO.

## 10. Testes

- **Unidade (Vitest):** regras do `domain` (correção, encerramento, sem contato, situação, sensível); importador, usando o log real do colega como caso de teste; exportadores (TXT reimportável sem perda, CSV, divisão do QR); paginação SSTV; divisão APRS; alfabeto fonético.
- **Ponta a ponta (Playwright):** criar operação, registrar chamadas, corrigir, encerrar e exportar, em tela de computador e de celular; funcionamento offline com a rede cortada.
- **Campo (feito pelo grupo):** ditado com o rádio ao lado; boletim SSTV recebido pelos apps dos membros (Robot36, MMSSTV); QR entre dois celulares; uma rede real registrada do começo ao fim.

## 11. Futuro (fora da v1)
1. Áudio SSTV gerado no app.
2. Winlink (Pat / Winlink Express) e flamp.
3. Leitura de posições APRS (APRSdroid, aprs.fi).
4. Vários operadores ao mesmo tempo com junção de logs.
5. Formulários ICS 213 e radiograma IARU.
