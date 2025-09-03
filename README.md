## Cash Ledger — Vison Hotel (MVP)

Single‑page React app — minimal, fast, and focused on daily cash workflow.

### Seções

- Resumo: cartões com Total Créditos, Total Movimentos e Resultado.
- Lançamentos: lista por data com Descrição, Valor (R$) e Saldo (R$).
- Acumulado: cartões com Entradas (contagem), Diárias (R$), Média (R$), Cozinha (R$), Bar (R$), Outros (R$).
- Entradas: por dia (Data) com três linhas (Dia, Noite, Total) e campos Entradas (N), Diárias (R$), Média (R$), Cozinha (R$), Bar (R$), Outros (R$).

Detalhes de UX

- Datas exibidas em DD/MM com calendário; em Entradas a Data é fixa e avança do 1º ao último dia do mês.
- “Adicionar Data” adiciona o próximo dia; “Preencher Mês” completa todos os dias restantes do mês.
- “Adicionar Lançamento” reutiliza a mesma Data do último lançamento; exige Descrição e Valor preenchidos (botão desabilita com mensagem explicativa).
- Campos monetários têm dica “R$” e alinham à direita; totais são somente leitura com “R$”.

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

### Notas
- Saldo/Resultando atualizam em tempo real.
- Campos somente leitura têm fundo sutil.
- Dados persistem localmente por mês; sincronização opcional via Sync ID.
