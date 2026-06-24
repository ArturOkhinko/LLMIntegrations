# LLM Integrations API

REST API (Express + TypeScript) for working with LLMs through the gptunnel proxy.
`POST /chat` supports normal (JSON) and streaming (SSE) responses, routes to the
right provider by `model`, and logs token usage and cost for every request.

## Setup

```bash
npm install
cp .env.example .env   # then set LLM_API_KEY
npm run dev
```

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start in watch mode (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/`     |
| `npm start`     | Run the compiled server           |
| `npm run lint`  | Lint with ESLint (Airbnb)         |
| `npm run format`| Run ESLint with auto-fix          |

## Test requests

### Claude — normal (stream: false)

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

### Claude — streaming (stream: true)

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

### ChatGPT — normal (stream: false)

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

### ChatGPT — streaming (stream: true)

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

### Aborted stream (interrupt after 5 seconds)

`--max-time 5` drops the connection after 5 seconds and triggers the abort path
(tokens estimated locally with tiktoken, logged as `approximate`).

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

```bash
curl -N --max-time 5 -X POST http://localhost:3000/chat \
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

> `-N` disables curl buffering so streamed deltas appear as they arrive.
> Token usage and cost are logged to `logs/usage.log`.
