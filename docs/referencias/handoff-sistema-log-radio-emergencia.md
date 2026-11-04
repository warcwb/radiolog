# Handoff – Sistema de Log de Comunicações de Rádio Emergência

## Contexto
- Usuário: radioamador da REER-PR (rede regional, RENER/LABRE, apoio à Defesa Civil e eventos – ex.: travessia de parque, BaseCOSMO).
- Fase atual: brainstorming / levantamento de requisitos (nada implementado ainda).
- Log de exemplo de um colega: formato "HH:MM INDICATIVO QSA-x QRK-y - Nome - obs", 145.210 MHz via repetidora PY5CTV (ARPA), FTM-100D 20W, GG54jm.

## Decisões / respostas do usuário
- Uso: (A) digitação em tempo real no computador, possivelmente offline; (B) no celular; (C) importar registros feitos em papel ou .txt. (D) vários operadores consolidando ao mesmo tempo: fora de escopo por ora.
- Abordagem proposta (aguardando aprovação): PWA offline (computador + celular, dados locais, sem servidor), com importação do .txt e exportação ICS 309.
- Novo requisito: possibilitar o ENVIO do log por meios de rádio (Winlink, fldigi/flmsg/flamp, SSTV, APRS, voz, QR code...). Proposta: o sistema gera os pacotes; a transmissão fica com programas existentes (fase 1); integração direta via Pat/fldigi XML-RPC (fase 2).
- Pergunta pendente ao usuário: quais meios o grupo usa ou tem equipamento para usar.

## Campos de log consolidados (ICS 309 + IARU + WICEN + ARRL)
- Cabeçalho: nome e nº da operação, tipo (real/exercício/evento), órgão apoiado, data, período, fuso (local/UTC), rede, frequência, repetidora, offset, tom, modo, NCS/adjunto/anotador.
- Entrada: hora, operador, tipo (entrada na rede, saída, tráfego, situação, mensagem formal, identificação, correção), De/Para (indicativo tático + oficial), nº da mensagem, precedência (Emergência/Prioridade/Bem-estar/Rotina, prefixo TESTE), assunto, QSA/QRK, local/grid.
- Encerramento: hora, total de estações, pendências (pessoas ou equipes sem confirmação de segurança), responsável, a quem o log foi entregue.
- Regras: log contínuo mesmo com troca de operador; nada é apagado (correção é uma nova entrada); ordem cronológica; entregue ao comandante ao final.
- Mensagem formal IARU: número, precedência, estação de origem, contagem de palavras, local de origem, hora e data em UTC.

## Pendente: leitura de documentos (bloqueados na sessão na nuvem)
- https://www.iaru-r1.org/wp-content/uploads/2019/09/emerg-ww.pdf
- https://www.iaru.org/wp-content/uploads/2020/01/emcommguide_1sept2016.pdf
- https://www.irts.ie/dnloads/ELARC_EmComm_Field_Manual_V1-0_Feb_2022.pdf
- https://www.arrl.org/files/file/Public%20Service/fsd218.pdf
- https://www.vic.wicen.org.au/wp-content/uploads/2011/05/LogKeeping.pdf
- https://stxd14ares.org/training/NET-119
- Anatel: Ato 3448/2026 (verificar se há regras sobre log e intervalo de identificação)
- Portaria MI 302/2001 (norma técnico-operacional da RENER)

## Próximos passos
1. Ler os documentos acima e confirmar os campos.
2. Resposta do usuário: quais meios de envio o grupo usa.
3. Aprovar a abordagem → desenho por seções → spec → plano de implementação.
