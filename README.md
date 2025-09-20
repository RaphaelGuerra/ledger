## Cash Ledger — Vison Hotel (MVP)

Single‑page React app — minimal, fast, and focused on daily cash workflow.

### Seções

- Resumo: cartões com Total Créditos, Total Movimentos e Resultado.
- Lançamentos: lista por data com Descrição, Valor (R$) e Saldo (R$).
- Acumulado: cartões com Entradas (contagem), Diárias (R$), Média (R$), Cozinha (R$), Bar (R$), Outros (R$).
- Entradas: por dia (Data) com três linhas (Dia, Noite, Total) e campos Entradas (N), Diárias (R$), Média (R$), Cozinha (R$), Bar (R$), Outros (R$).

Detalhes de UX

- Datas exibidas em DD/MM com calendário; em Entradas a Data é fixa e avança do 1º ao último dia do mês.
- “Adicionar Data” preenche automaticamente quaisquer datas intermediárias faltantes até o próximo dia disponível; “Preencher Mês” completa todos os dias restantes do mês.
- “Adicionar Lançamento” reutiliza a mesma Data do último lançamento; exige Descrição e Valor preenchidos (botão desabilita com mensagem explicativa).
- Campos monetários têm dica “R$” e alinham à direita; totais são somente leitura com “R$”.

### Impressão (A4)

- Botão “Imprimir” no cabeçalho gera uma folha compacta (A4 retrato) com:
  - Cabeçalho: logo, nome, Mês/Ano, ID (opcional) e data/hora da impressão.
  - Resumo: Créditos, Movimentos e Resultado.
  - Acumulado: Entradas (N), Diárias (R$), Média (R$), Cozinha (R$), Bar (R$), Outros (R$).
  - Lançamentos: Data, Descrição, Valor, Saldo (apenas linhas preenchidas) com continuação automática em páginas extras quando houver mais de 32 linhas.
  - Entradas: por Data (Dia, Noite, Total) com separadores visuais e linha de total destacada.
- Estilo tipo planilha: bordas finas, números alinhados à direita, sem sombras/cores fortes.
- Dicas:
  - Escala 100%. Margens ~10mm. Cabeçalhos/rodapés do navegador podem ser desativados.
  - Melhor visual no Chrome/Edge; verifique pré‑visualização antes de imprimir.

### Rodar localmente

```bash
npm install
npm run dev
```

Ambiente:

- Sem variáveis obrigatórias. Opcional: configure um endpoint `/api/storage/<SyncID>/<YYYY-MM>` no seu host (ex.: Cloudflare Pages Functions + KV) para sincronizar entre dispositivos.

### Sincronizar entre dispositivos (opcional)

- Informe um ID na seção “ID” do cabeçalho. Os dados do mês ativo serão enviados/consultados em `/api/storage/<SyncID>/<YYYY-MM>`.
- Sem autenticação: escolha um ID privado e difícil de adivinhar.
- Se não houver backend configurado, o app funciona normalmente apenas com armazenamento local.

### Build

```bash
npm run build
```

### Código (visão geral)

- `src/components/EntradasDiarias.jsx`: edição das entradas por dia (tabela no desktop; cartões no mobile).
- `src/components/Ledger.jsx`: lançamentos (descrição + valor) com saldo acumulado.
- `src/components/PrintSheet.jsx`: folha de impressão simplificada.
- `src/lib/date.js`: utilitários de data (DD/MM, adicionar dias, rótulo de mês, avançar/voltar mês).
- `src/lib/number.js`: utilitários numéricos e formatação (`toNumberOrZero`, `fmt2`, `fmtBRL`, `isBlank`).
- `src/lib/stats.js`: agregações puras para Créditos e Acumulado.
- `src/lib/selectors.js`: seletores reutilizáveis (filtrar e ordenar por mês/data).
- `src/lib/store.js`: persistência (localStorage) e sincronização remota (fetch).

Racional de refatoração:

- Removida duplicação de helpers (número/formatação) dos componentes; agora ficam em `src/lib/number.js`.
- Cálculos de totais/estatísticas migrados para `src/lib/stats.js` (funções puras, fáceis de testar).
- Navegação e rótulo de mês movidos para `src/lib/date.js` para manter o `App.jsx` focado em estado/fluxo.

### Qualidade de Código

- Lint: `npm run lint`
- Format: `npm run format`
- Testes (lib): `npm run test`
- Checagem rápida (build + lint): `npm run check`

Veja também: `IMPROVEMENTS.md` para o roadmap e acompanhamento.

### Notas
- Saldo/Resultando atualizam em tempo real.
- Campos somente leitura têm fundo sutil.
- Dados persistem localmente por mês; sincronização opcional via Sync ID.
