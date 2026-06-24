# LLM Integrations API

REST API (Express + TypeScript) for working with LLMs through the gptunnel proxy.
One `POST /chat` endpoint accepts a chat request, routes it to the right provider
by `model`, supports normal (single JSON) and streaming (SSE) responses, and logs
token usage for every request.

## Stack

- **Express 4** + **TypeScript**
- **ESLint** with `airbnb-base` + `airbnb-typescript/base`
- **pino** / **pino-http** — structured logging to `logs/app.log`
- **zod** — request validation

## Setup

```bash
npm install
cp .env.example .env   # then set LLM_API_KEY
npm run dev
```

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start in watch mode (ts-node-dev) |
| `npm run build`  | Compile TypeScript to `dist/`     |
| `npm start`      | Run the compiled server           |
| `npm run lint`   | Lint with ESLint (Airbnb)         |
| `npm run format` | Run ESLint with auto-fix          |

## Endpoints

- `GET /health` — health check
- `POST /chat` — send a chat request.

### Request body

| Field        | Type                                                 | Notes                     |
| ------------ | ---------------------------------------------------- | ------------------------- |
| `model`      | `"claude-sonnet-4-20250514"` \| `"gpt-5-mini"`       | selects the provider      |
| `max_tokens` | number, optional                                     | default `256`, max `4096` |
| `stream`     | boolean, optional                                    | default `false`           |
| `messages`   | `{ role: "user" \| "assistant", content: string }[]` | non-empty                 |

The provider is chosen automatically from `model`: `claude-*` → Anthropic
(`/v1/messages`), `gpt-*` → OpenAI (`/v1/chat/completions`). Token usage is logged
to `logs/app.log` after each request.

## Test requests

### Claude (claude-sonnet-4-20250514) — normal (stream: false)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 256,
    "stream": false,
    "messages": [
      {"role": "user", "content": "Say hello in one short sentence and name yourself."}
    ]
  }'
```

### Claude (claude-sonnet-4-20250514) — streaming (stream: true)

```bash
curl -N -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 256,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Say hello in one short sentence and name yourself."}
    ]
  }'
```

### ChatGPT (gpt-5-mini) — normal (stream: false)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "max_tokens": 256,
    "stream": false,
    "messages": [
      {"role": "user", "content": "Say hello in one short sentence and name yourself."}
    ]
  }'
```

### ChatGPT (gpt-5-mini) — streaming (stream: true)

```bash
curl -N -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "max_tokens": 256,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Say hello in one short sentence and name yourself."}
    ]
  }'
```

> `-N` disables curl buffering so streamed deltas appear as they arrive.

### Aborted stream (interrupt after 5 seconds)

`--max-time 5` makes curl drop the connection after 5 seconds, which triggers
the abort path: the server stops the upstream request and logs **measured**
usage (`approximate: true`) to `logs/usage.log`. Use a long prompt + high
`max_tokens` so the stream is still running at the cut-off.

#### Claude (claude-sonnet-4-20250514)

```bash
curl -N --max-time 5 -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 2000,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Write a long detailed story, at least 1500 words."}
    ]
  }'
```

#### ChatGPT (gpt-5-mini)

```bash
curl -N --max-time 10 -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5-mini",
    "max_tokens": 2000,
    "stream": true,
    "messages": [
      {"role": "user", "content": "Write a long detailed story, at least 1500 words."}
    ]
  }'
```

On abort, tokens are estimated locally with `tiktoken/o200k_base` (no extra API
call) and the record is marked `approximate: true`.

## Responses

Normal mode returns a single JSON object:

```json
{
  "model": "claude-sonnet-4-20250514",
  "content": "Hello! I'm Claude.",
  "usage": { "inputTokens": 12, "outputTokens": 8, "totalTokens": 20 },
  "cost": {
    "inputCost": 0.0144,
    "outputCost": 0.036,
    "totalCost": 0.0504,
    "currency": "RUB",
    "source": "calculated"
  }
}
```

`cost.source` is `provider` when gptunnel returns cost fields in `usage`
(authoritative, billed in RUB), otherwise `calculated` from the local pricing
table (`src/config/pricing.ts`, RUB per 1000 tokens).

Streaming mode returns Server-Sent Events; each delta is a `data:` frame, and the
stream ends with `data: [DONE]`:

```
data: {"text":"Hello"}

data: {"text":"! I'm Claude."}

data: [DONE]
```

## Logging

Application logs are written as JSON to `logs/app.log` (directory auto-created)
and, in non-production, pretty-printed to stdout.

Token usage and cost are logged separately to `logs/usage.log` after each
request (both normal and streaming): `inputTokens` / `outputTokens` /
`totalTokens` plus a `cost` object (`inputCost` / `outputCost` / `totalCost` /
`currency` / `source`). If a stream is interrupted before the provider reports
usage, tokens are estimated locally with `tiktoken/o200k_base` and the record is
marked `approximate: true`.

## Project structure

```
src/
  app.ts                       # express app + middleware wiring
  server.ts                    # bootstrap / graceful shutdown
  config/index.ts              # env config
  controllers/
    chat.controller.ts         # POST /chat: normal + stream branches
  routes/
    chat.routes.ts
  middleware/
    validateBody.ts            # zod validation
    errorHandler.ts
  schemas/
    chat.schema.ts             # request contract (zod) + ChatRequestDto
  services/
    chat.service.ts            # orchestration + token logging
  providers/
    registry.ts                # model -> provider
    types.ts                   # Provider interface
    httpClient.ts              # postJson + streamSse (SSE parser)
    anthropic.provider.ts      # /v1/messages
    openai.provider.ts         # /v1/chat/completions
  errors/
    ApiError.ts
  utils/
    logger.ts                  # pino -> file
    sse.ts                     # SSE headers + framing
  types/
    chat.ts                    # ChatResult, TokenUsage
    stream.ts                  # StreamEvent
```
