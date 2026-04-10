# F1 Races Bot

Telegram bot em Node.js/TypeScript para acompanhar a temporada atual da F1.

## Funcionalidades

- `/next_race`: mostra a próxima corrida da temporada, circuito, local e contagem regressiva.
- `/standings`: mostra classificação de pilotos e construtores da temporada atual.
- `/subscribe`: ativa alertas automáticos para o chat.
- `/unsubscribe`: desativa alertas automáticos para o chat.
- `/subscriptions`: informa se o chat está inscrito para receber alertas.

## Como funciona

- O bot consulta dados da API Jolpica (compatível com Ergast) para corridas e classificações.
- As inscrições de alertas ficam salvas em SQLite via Prisma.
- Um agendador (`node-cron`) roda em UTC e envia alerta na segunda-feira anterior à corrida.
- O envio é idempotente por chat/corrida/janela, evitando alertas duplicados.

## Pré-requisitos

- Node.js 20+
- npm
- Token de bot do Telegram (BotFather)

## Instalação

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do `.env.example`:

```bash
cp .env.example .env
```

Depois, edite o `.env` e preencha principalmente o `TELEGRAM_API_TOKEN`.

Arquivo `.env.example` atual:

```env
TELEGRAM_API_TOKEN=""
DATABASE_URL="file:./dev.db"
ALERTS_CRON="0 9 * * *"
```

Variáveis de ambiente:

- `TELEGRAM_API_TOKEN` (obrigatória): token do bot no Telegram.
- `DATABASE_URL` (obrigatória): URL do banco SQLite usado pelo Prisma.
- `ALERTS_CRON` (opcional): expressão cron em UTC para executar o scheduler (padrão `0 9 * * *`).

3. Gere o client do Prisma e aplique migrações:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Rodando em desenvolvimento

```bash
npm run dev
```

Quando iniciar corretamente, o bot começa em polling e registra os comandos e o scheduler de alertas.

## Testes

```bash
npm test
```

## Lint

```bash
npm run lint
```

Para corrigir automaticamente problemas suportados:

```bash
npm run lint:fix
```

## Scripts úteis

- `npm run dev`: inicia o bot com hot reload via `tsx watch`.
- `npm test`: executa os testes com Vitest.
- `npm run lint`: executa o lint com Biome.
- `npm run lint:fix`: aplica correções automáticas do lint com Biome.
- `npm run prisma:generate`: gera o client Prisma.
- `npm run prisma:migrate`: cria/aplica migrações de desenvolvimento.
- `npm run prisma:studio`: abre interface do Prisma Studio.

## Estrutura do projeto

```text
f1-races-bot/
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260409025054_init_subscriptions/
│           └── migration.sql
└── src/
    ├── bot.ts
    ├── env.ts
    ├── db/
    │   └── prisma.ts
    ├── types/
    │   ├── eargast.ts
    │   └── language.ts
    ├── commands/
    │   ├── get-next-race.ts
    │   ├── get-standings.ts
    │   ├── subscription.ts
    │   └── _tests/
    │       ├── get-next-race.property.test.ts
    │       ├── get-next-race.test.ts
    │       ├── get-standings.property.test.ts
    │       ├── get-standings.test.ts
    │       └── subscription.test.ts
    ├── notifications/
    │   ├── format.ts
    │   ├── scheduler.ts
    │   └── _tests/
    │       └── scheduler.test.ts
    └── subscriptions/
        └── repository.ts
```

## Observações

- O scheduler usa timezone UTC.
- A seleção da próxima corrida considera a data (`YYYY-MM-DD`) retornada pela API.
- A mensagem de `/next_race` tenta ajustar timezone com base no idioma do usuário; fallback para UTC.
