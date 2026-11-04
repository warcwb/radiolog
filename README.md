# RadioLog

Log de comunicações de rádio emergência (REER-PR / RENER). Aplicativo que abre no navegador
do computador ou do celular e **funciona sem internet** depois do primeiro acesso.

Ele registra a rede em tempo real, importa logs em .txt e gera ICS 309 (PDF), CSV, TXT,
QR code e boletins para SSTV, APRS e voz.

## Como usar

### Abrir e instalar
1. Abra o endereço do RadioLog no Chrome (Android ou Windows) ou no Safari (iPhone) **com internet, uma vez**.
2. Para instalar como app:
   - **Android:** menu ⋮ → **Adicionar à tela inicial**.
   - **iPhone:** botão Compartilhar → **Adicionar à Tela de Início**.
   - **Windows:** ícone de instalar, na barra de endereço.
3. A partir daí, o app abre e funciona mesmo sem internet.
4. Em **Configurações**, informe seu indicativo e seu nome.

### Registrar uma rede
1. **Nova operação:** preencha nome e frequência. Se a rede é semanal, use "Copiar configuração de operação anterior".
2. Na tela **Log**, digite o começo do indicativo e toque na sugestão. QSA e QRK repetem os da última vez; toque em **REGISTRAR**.
3. **Estação nova:** abre um mini cadastro. Marque **Campo** ou **Móvel** para as equipes em deslocamento; o app avisa se elas ficarem mais de 30 minutos sem contato.
4. Outros registros:
   - **IDENT:** registra a identificação da sua estação.
   - **Não identificada (?):** registra uma estação que não deu para identificar.
   - **Mais opções:** precedência (EMERGÊNCIA, PRIORIDADE…), número da mensagem, local e outros tipos, como troca de operador.
5. Para corrigir, toque na entrada e depois em **Corrigir**. **Nada é apagado:** a correção vira uma nova entrada, e a original aparece riscada.
6. Para ditar, use o microfone do teclado do celular, que funciona offline se o idioma português estiver baixado.

### Encerrar
Na aba **Encerrar**, o app só deixa encerrar quando todas as equipes de campo registraram
**SAÍDA**. Se faltar alguma, é preciso escrever uma justificativa. Depois de encerrar, use
**Gerar ICS 309** para entregar à Defesa Civil.

### Backup
O app guarda tudo no próprio aparelho, mas o navegador pode apagar esses dados. Para não perder nada:
- Em **Enviar → QR / arquivo → Arquivo de backup (JSON)**, salve uma cópia. O app lembra a cada 30 registros.
- Para restaurar ou abrir em outro aparelho, use **Importar log** e escolha o .json.

### Passar o log para outro aparelho (troca de turno, sem internet)
1. No aparelho que tem o log: **Enviar → QR / arquivo → Mostrar QR codes**. Use "Próximo" para passar os códigos.
2. No outro aparelho: **Importar log → Ler QR code de outro aparelho** e aponte a câmera para cada código. A contagem (2/5…) mostra o progresso.

### Boletim por SSTV
1. Abra **Enviar → SSTV**, escolha o boletim e o modo (Robot36, Martin M1, Scottie S1 ou PD120).
2. Toque em **Baixar PNG**.
3. Abra a imagem no seu app de SSTV (Robot36 no celular, MMSSTV ou QSSTV no computador) e transmita **no mesmo modo**.

Dados sensíveis (vítimas, feridos, telefone, CPF) aparecem como **[dado reservado]** em
SSTV, APRS e voz. Nos arquivos entregues à Defesa Civil (PDF, CSV, TXT), eles saem completos.

### APRS e voz
- **APRS:** mensagens prontas de até 67 caracteres. Toque em **Copiar** e cole no APRSdroid ou no rádio.
- **Voz:** um roteiro de leitura com os indicativos soletrados (Papa Uniform Cinco…).

### Importar o log de outro radioamador
Em **Importar log**, escolha o .txt. A prévia mostra cada linha:
- **verde:** reconhecida;
- **amarelo:** confira (por exemplo, indicativos parecidos como PU5JEF/PY5JEF, ou "a grande maioria desceu em segurança");
- **vermelho:** não reconhecida, mas guardada como observação.

Nada é gravado antes de **Confirmar importação**. Arquivos salvos no Bloco de Notas são lidos com os acentos corretos.

## Limitações conhecidas
- **Nomes de pessoas não são marcados como sensíveis automaticamente.** Marque à mão quando o texto tiver o nome de alguém atendido.
- O microfone do navegador pode precisar de internet; o ditado do teclado do celular funciona offline.
- Vários operadores no mesmo log ao mesmo tempo, Winlink, flamp e o áudio SSTV gerado pelo próprio app ficam para uma próxima versão.

## Checklist do teste de campo
- [ ] Ditado do teclado com o rádio ligado ao lado: o texto sai certo?
- [ ] Boletim SSTV recebido pelos apps dos membros (Robot36, MMSSTV): dá para ler?
- [ ] QR code entre dois celulares: passou o log inteiro?
- [ ] Uma rede real registrada do começo ao fim, com encerramento e ICS 309.
- [ ] O app abre sem internet (modo avião) depois de instalado.

## Para desenvolvedores
```bash
npm ci
npm run typecheck && npm test && npm run build
npm run e2e        # Playwright: computador e celular, incluindo modo offline
```
- Especificação: `docs/superpowers/specs/2026-11-03-radiolog-design.md`
- Plano: `docs/superpowers/plans/2026-11-04-radiolog-v1.md`
