# TruthSeeker — GenAI Research & Verification

TruthSeeker is a full-stack research assistant that searches the web with Tavily and asks Google Gemini to assess a claim against retrieved evidence. It returns a structured report with source-attributed supporting and contradicting evidence.

> **Important:** TruthSeeker is an AI-assisted research tool, not an authoritative fact-checking service. A verdict and confidence estimate can be wrong. Review the original sources before relying on a result.

## Features

- React + TypeScript + Vite interface
- Express + TypeScript API
- Tavily web retrieval followed by Gemini evidence synthesis (RAG-style workflow)
- Zod validation for requests and model responses
- Source IDs checked against retrieved sources; original retrieved URLs are used for links
- Duplicate URL removal, safe external-link attributes, rate limiting, Helmet, configurable CORS
- Loading/error states, copy report, copy citations, and local search history
- Unit tests using mocked external APIs (no API keys needed)

## Requirements

- Node.js 20+
- npm 10+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- A Tavily API key from [Tavily](https://tavily.com/)

## Local setup

```bash
npm install
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set `GEMINI_API_KEY` and `TAVILY_API_KEY`. Then run:

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend health: http://localhost:4000/api/health

On Windows PowerShell, create the environment file with:
```powershell
Copy-Item backend/.env.example backend/.env
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | For live research | — | Server-side Gemini API key |
| `TAVILY_API_KEY` | For live research | — | Server-side Tavily API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |
| `PORT` | No | `4000` | Express port |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | Allowed browser origin |
| `REQUEST_TIMEOUT_MS` | No | `20000` | Timeout for each upstream request |
| `NODE_ENV` | No | `development` | Runtime environment |

Never put provider keys in frontend variables such as `VITE_*`. Never commit `.env`.

## Architecture

1. Browser submits a claim to `POST /api/research`.
2. Express validates the query with Zod and checks that provider keys exist.
3. Tavily searches for relevant sources. Duplicate URLs are removed.
4. The backend passes numbered source evidence to Gemini as untrusted reference material.
5. Gemini returns structured JSON; Zod validates it.
6. Every evidence source ID is checked against the retrieved source list. Invalid IDs fail closed rather than becoming fabricated citations.
7. The API returns the report and the exact source URLs retrieved by Tavily.

## API

### `GET /api/health`

```json
{ "status": "ok" }
```

### `POST /api/research`

Request:
```json
{ "query": "A claim or question to investigate" }
```

Success returns `claim`, `verdict`, `confidence`, `summary`, `supportingEvidence`, `contradictingEvidence`, `limitations`, and `sources`.

Possible verdicts: `Supported`, `Partially Supported`, `Contradicted`, `Insufficient Evidence`.

Typical error response:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please enter a query between 8 and 1000 characters." } }
```

## Test and build

```bash
npm test
npm run build
```

Backend tests mock Tavily and Gemini; no network calls or API keys are needed. `npm run build` compiles the API and builds the frontend.

## Deployment

Deploy the frontend and backend as separate services.

### Backend (for example, Render)
- Root directory: repository root
- Build command: `npm install && npm run build -w backend`
- Start command: `npm run start -w backend`
- Set `GEMINI_API_KEY`, `TAVILY_API_KEY`, `FRONTEND_ORIGIN` (your frontend URL), and optional runtime settings in the host dashboard.

### Frontend (for example, Vercel)
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to the deployed backend URL, e.g. `https://your-api.example.com`.

The backend must permit the deployed frontend origin through `FRONTEND_ORIGIN`. Configure HTTPS through your hosting provider.

## Security and known limitations

- Retrieved pages may contain malicious prompt-injection text; the model prompt explicitly treats them as untrusted evidence, but prompt injection cannot be eliminated completely.
- Tavily snippets are not a substitute for reading the complete primary source.
- Source availability, recency, and quality vary. Search presence does not establish credibility.
- Confidence is the model's qualitative estimate, not a calibrated probability.
- This starter does not include accounts, persistent server-side history, or an independent human fact-checking process.

## Troubleshooting

- If the UI says **Gemini rejected the API key**, create/verify a key in Google AI Studio, update `GEMINI_API_KEY` in `backend/.env`, and restart `npm run dev`. Never paste API keys into PowerShell as `NAME=value`; that syntax is not valid PowerShell. Put the variables in the `.env` file instead.
- If the UI says **Gemini quota or rate limit reached**, check the project's Google AI Studio quota/usage.
- If the UI says the model is unavailable, check `GEMINI_MODEL` in `backend/.env`. The default is `gemini-2.5-flash`.
- Backend logs include sanitized provider diagnostics to help identify upstream failures. Do not share or commit `.env` files. If an API key has been pasted into a chat or public repository, revoke it and create a replacement.
- Run `npm run build` from the project root to verify both workspaces.
