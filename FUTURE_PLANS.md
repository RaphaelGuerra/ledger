# Future Plans

## Print: Lançamentos Multi‑Page Continuation (Issue #19) — ✅ Delivered

- Implemented column chunking that paginates every 32 lançamentos (4 columns × 8 linhas) e adiciona quebra de página controlada.
- Cada página repete os cabeçalhos e mantém o saldo acumulado contínuo, com aviso “Continua na próxima página…” entre páginas.
- Users now obtêm todas as linhas na impressão sem precisar exportar manualmente.
- Follow-ups:
  - Validar se o aviso textual é suficiente ou se precisamos de marcador visual adicional entre páginas.
  - Adicionar snapshot/regressão visual (ver `IMPROVEMENTS.md`, item de tooling).

Code references: `src/components/PrintSheet.jsx` (`lancPages`) e estilos de impressão em `src/App.css`.

## Entradas: Auto‑Fill Missing Dates on Add (Issue #20) — ✅ Delivered

- `computeDatesToAdd` garante que “Adicionar Data” preencha todas as datas intermediárias até o próximo dia disponível do mês ativo.
- O botão “Preencher Mês” permanece para completar o restante do mês quando desejado, agora trabalhando em conjunto com a nova lógica incremental.
- A experiência evita lacunas acidentais e reduz cliques para meses parcialmente preenchidos.
- Follow-ups:
  - Considerar copy/tooltip informando quando várias datas forem criadas de uma vez.
  - Cobrir `computeDatesToAdd` com testes unitários adicionais (já existe cobertura básica em `src/lib/entradas.test.js`).

Code references: `src/components/EntradasDiarias.jsx` (`addDateRow`) e `src/lib/entradas.js`.

## Próximos Focos

- Documentar regras de chunking de impressão diretamente no README (Issue #18).
- Avaliar smoke tests/snapshots para garantir estabilidade visual após mudanças (ver backlog de tooling).
- Agrupar componentes por feature (`ledger`, `entradas`) quando o ritmo de mudanças desacelerar (Issue #10).

