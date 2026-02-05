# Tech Stack

## Quick Reference
```
Frontend:  Next.js 14 (React) + Tailwind CSS + shadcn/ui
Backend:   Next.js API Routes (Node.js)
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth
AI:        Claude API (Anthropic)
Hosting:   Railway
VCS:       GitHub
```

## Stack Decisions

| Category | Choice | Why | Rejected Alternatives |
|----------|--------|-----|----------------------|
| Frontend Framework | Next.js 14 | React-based (team preference), full-stack capability, excellent DX | Create React App (no SSR), Remix (less ecosystem) |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design, accessible components | Material UI (heavier), custom CSS (slower) |
| Backend | Next.js API Routes | Single deployment, no separate backend, simpler architecture | Express.js (extra deployment), Python FastAPI (different stack) |
| Database | Supabase (PostgreSQL) | Managed Postgres, built-in auth, real-time capable, generous free tier | PlanetScale (MySQL), Firebase (NoSQL) |
| Authentication | Supabase Auth | Integrated with DB, supports email/password, easy role management | Auth0 (separate service), NextAuth (more config) |
| AI/LLM | Claude API | Existing API key, strong semantic understanding, good at structured output | OpenAI GPT-4 (no existing key), local LLM (complexity) |
| Hosting | Railway | Team's existing platform, simple deploys, good Next.js support | Vercel (fine alternative), AWS (overkill) |
| Sitemap Crawling | Node.js (axios + cheerio) | Keeps stack unified, sufficient for XML parsing | Python (BeautifulSoup) - better but adds complexity |
| Tree Visualization | react-flow or custom SVG | Flexible, supports nesting, good performance | D3.js (steeper learning), Mermaid (less interactive) |

## External Services

| Service | Purpose | Auth Method | Rate Limits | Docs Location |
|---------|---------|-------------|-------------|---------------|
| Supabase | Database + Auth | API Key (anon + service role) | Generous (free tier: 500MB DB, 50K monthly active users) | https://supabase.com/docs |
| Claude API | Page comparison, semantic matching | Bearer token (API key) | Varies by tier; track usage | https://docs.anthropic.com |
| Client Websites | Sitemap source | None (public) | Respect robots.txt, 1 req/sec | N/A |

## Package Versions

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@anthropic-ai/sdk": "^0.14.0",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.300.0",
    "zod": "^3.22.0",
    "react-flow": "^11.10.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

## Dev Tools

| Tool | Purpose |
|------|---------|
| TypeScript | Type safety, better DX, fewer runtime errors |
| ESLint | Code quality, catch errors early |
| Prettier | Consistent formatting |
| Tailwind Prettier Plugin | Auto-sort Tailwind classes |
| VS Code / Cursor | Primary IDE with AI assistance |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Yes |
| `CLAUDE_API_KEY` | Anthropic Claude API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL (for callbacks) | Yes |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        RAILWAY                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Next.js App                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Pages     │  │ API Routes  │  │  Components  │  │  │
│  │  │  (React)    │  │  (Node.js)  │  │  (React)     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Supabase   │      │  Claude API │      │   Client    │
│  (DB+Auth)  │      │ (Anthropic) │      │  Websites   │
└─────────────┘      └─────────────┘      └─────────────┘
```
