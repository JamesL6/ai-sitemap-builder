# Development Environment

## Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 18.x or 20.x LTS | https://nodejs.org/ or `nvm install --lts` |
| npm | 10.x+ | Included with Node.js |
| Git | 2.x+ | https://git-scm.com/ |
| VS Code / Cursor | Latest | https://cursor.sh/ |

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIs...` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | `eyJhbGciOiJIUzI1NiIs...` | Yes |
| `CLAUDE_API_KEY` | Anthropic Claude API key | `sk-ant-api03-...` | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` | Yes |

## Initial Setup

```bash
# Step 1: Clone the repository
git clone https://github.com/your-org/ai-sitemap-builder.git
cd ai-sitemap-builder

# Step 2: Install dependencies
npm install

# Step 3: Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Step 4: Set up Supabase database
# Option A: Use Supabase CLI (recommended)
npx supabase init
npx supabase db push

# Option B: Run SQL manually in Supabase dashboard
# Copy contents of supabase/migrations/*.sql

# Step 5: Seed initial data (optional)
npm run db:seed

# Step 6: Start development server
npm run dev
```

## Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Running Tests

```bash
# All tests
npm test

# Tests with coverage
npm run test:coverage

# Watch mode (for development)
npm run test:watch

# E2E tests (requires dev server running)
npm run test:e2e
```

## Database Operations

```bash
# Generate Supabase types
npm run db:types

# Create new migration
npx supabase migration new migration_name

# Apply migrations (local)
npx supabase db push

# Reset database (WARNING: destroys data)
npx supabase db reset

# View database in browser
npx supabase studio
```

## Deployment

| Environment | URL | Branch | Deploy Command |
|-------------|-----|--------|----------------|
| Development | http://localhost:3000 | - | `npm run dev` |
| Preview | Auto-generated | PR branches | Auto (Railway) |
| Production | https://sitemap-builder.yourcompany.com | main | Auto on push (Railway) |

### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project (first time)
railway link

# Deploy manually (usually auto-deploys on push)
railway up

# View logs
railway logs

# Open dashboard
railway open
```

### Environment Variables in Railway

Set these in Railway dashboard (Project → Variables):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`
- `NEXT_PUBLIC_APP_URL` (set to Railway-provided domain)

## Supabase Setup

### 1. Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name, password, region
4. Wait for project to initialize

### 2. Get API Keys
1. Go to Project Settings → API
2. Copy `URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Migrations
Copy and run each SQL file from `supabase/migrations/` in the SQL Editor.

### 4. Enable Auth
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure any additional providers (Google, etc.)

## Claude API Setup

### 1. Get API Key
1. Go to https://console.anthropic.com/
2. Create account or log in
3. Go to API Keys
4. Create new key
5. Copy to `CLAUDE_API_KEY`

### 2. Set Usage Limits
1. Go to Settings → Limits
2. Set monthly limit to $50 (or desired amount)
3. Enable notifications at 80% usage

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL is not defined` | Missing env var | Check `.env.local` exists and has correct values |
| `Auth session missing` | Cookie not set | Clear cookies, ensure HTTPS in production |
| `CORS error on API call` | Wrong Supabase URL | Verify URL matches dashboard |
| `Claude API 401` | Invalid API key | Regenerate key in Anthropic console |
| `Crawl timeout` | Slow client site | Increase timeout or use manual input |
| `Railway deploy fails` | Missing env vars | Set all variables in Railway dashboard |
| `Type errors after schema change` | Outdated types | Run `npm run db:types` |

## VS Code / Cursor Extensions

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript + JavaScript
- Prisma (if using)
- GitLens

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit
git add .
git commit -m "feat: description of changes"

# Push and create PR
git push -u origin feature/your-feature-name
# Create PR in GitHub

# After merge, clean up
git checkout main
git pull
git branch -d feature/your-feature-name
```

### Commit Message Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Tests
- chore: Maintenance
```

## Useful Commands

```bash
# Check Node version
node -v

# Check npm version
npm -v

# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules && npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```
