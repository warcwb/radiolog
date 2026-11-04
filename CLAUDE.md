# RadioLog — contexto para o Claude Code

Log de comunicações de rádio emergência (REER-PR / RENER), PWA offline para computador e
celular. Dono: Wellington (radioamador, Curitiba/PR). Converse em **português do Brasil**,
em linguagem simples: ele usa Windows e não é programador.

- Spec: `docs/superpowers/specs/2026-11-03-radiolog-design.md`
- Plano: `docs/superpowers/plans/2026-11-04-radiolog-v1.md` (executado etapa por etapa)
- Log real de referência (caso de teste do importador): `docs/referencias/exemplo-log-colega-2026-10-31.txt`
- Comandos: `npm ci && npm run typecheck && npm test && npm run build` (e `npm run e2e` depois da Task 13)
- Regra central: o log é somente-acréscimo — nada é editado ou apagado; correção é nova entrada.
- Projeto separado do RadioForge (`warcwb/radioforge`, programador de rádios).
