# Security Guidelines

## Authentication

- **Method:** Supabase Auth (email/password)
- **Session Duration:** 1 week (refreshable)
- **Token Storage:** HTTP-only cookies (managed by Supabase SSR)
- **Refresh Strategy:** Automatic via Supabase middleware

### Auth Flow
```
1. User submits credentials
2. Supabase validates and returns session
3. Session stored in HTTP-only cookie
4. Middleware validates session on each request
5. Session auto-refreshes before expiration
```

## Authorization Matrix

| Role | Resource | Create | Read | Update | Delete |
|------|----------|--------|------|--------|--------|
| Admin | Templates | Yes | Yes (all) | Yes | Yes |
| Admin | Projects | Yes | Yes (own) | Yes (own) | Yes (own) |
| Admin | Users | No | Yes (all) | No | Yes |
| User | Templates | No | Yes (active) | No | No |
| User | Projects | Yes | Yes (own) | Yes (own) | Yes (own) |
| User | Sitemap Nodes | Yes (own projects) | Yes (own projects) | Yes (own projects) | Yes (own projects) |

## Data Classification

| Data Type | Classification | Storage | Transmission | Retention |
|-----------|---------------|---------|--------------|-----------|
| User email | Internal | Encrypted at rest (Supabase) | HTTPS only | Account lifetime |
| User password | Confidential | Hashed (bcrypt via Supabase) | HTTPS only | Account lifetime |
| Project data | Internal | Encrypted at rest | HTTPS only | Until deleted |
| Client URLs | Internal | Plain text | HTTPS only | Project lifetime |
| Claude API Key | Restricted | Environment variable only | Never transmitted to client | N/A |
| Supabase Service Key | Restricted | Environment variable only | Never transmitted to client | N/A |

## Input Validation Rules

| Input Type | Validation | Sanitization | Max Length |
|-----------|-----------|--------------|------------|
| Email | RFC 5322 format | Lowercase, trim | 255 |
| Project name | Non-empty string | Trim, escape HTML | 255 |
| Client URL | Valid URL format | Normalize protocol | 500 |
| Location name | Non-empty string | Trim, escape HTML | 255 |
| URL slug | Alphanumeric + hyphens | Lowercase, trim | 100 |

### Validation Implementation

```typescript
// lib/utils/validation.ts
import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .transform(s => s.trim()),
  client_url: z.string()
    .url('Invalid URL')
    .max(500)
    .optional()
    .or(z.literal('')),
})

export const locationSchema = z.object({
  name: z.string()
    .min(1)
    .max(255)
    .transform(s => s.trim()),
  url_slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens')
    .max(100),
})
```

## API Security

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 requests | 1 minute |
| `/api/crawl` | 5 requests | 1 minute |
| `/api/ai/compare` | 10 requests | 1 minute |
| All other endpoints | 100 requests | 1 minute |

### CORS Policy
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### API Key Handling
- **Storage:** Environment variables only
- **Access:** Server-side code only (API routes)
- **Logging:** Never log API keys
- **Rotation:** Rotate if compromised

## NEVER Do (Non-Negotiable)

1. **NEVER** expose `CLAUDE_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client
2. **NEVER** store API keys in code, commits, or client-accessible files
3. **NEVER** trust user input without validation
4. **NEVER** use string concatenation for SQL queries (use Supabase client)
5. **NEVER** disable Row Level Security (RLS) in production
6. **NEVER** log passwords, API keys, or sensitive tokens
7. **NEVER** send sensitive data in URL query parameters
8. **NEVER** use `eval()` or similar dynamic code execution
9. **NEVER** skip authentication checks on protected routes
10. **NEVER** expose internal error details to users

## ALWAYS Do

1. **ALWAYS** use Supabase Auth for authentication
2. **ALWAYS** check user ownership before data operations
3. **ALWAYS** validate and sanitize all user inputs (use Zod)
4. **ALWAYS** use HTTPS in production
5. **ALWAYS** implement rate limiting on expensive operations
6. **ALWAYS** store secrets in environment variables
7. **ALWAYS** use parameterized queries (Supabase client handles this)
8. **ALWAYS** return generic error messages to users (log details server-side)
9. **ALWAYS** verify user role before admin operations
10. **ALWAYS** set security headers (CSP, X-Frame-Options, etc.)

## Secrets Management

| Secret | Storage Location | Rotation Policy |
|--------|-----------------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Railway environment variables | If compromised |
| `CLAUDE_API_KEY` | Railway environment variables | If compromised |
| Database password | Supabase (managed) | Via Supabase dashboard |

### Accessing Secrets

```typescript
// CORRECT: Server-side only
// app/api/ai/compare/route.ts
const apiKey = process.env.CLAUDE_API_KEY // OK - runs on server

// WRONG: Client-side exposure
// components/SomeComponent.tsx
const apiKey = process.env.CLAUDE_API_KEY // NEVER - this would be undefined anyway
```

## Row Level Security (RLS) Policies

All tables MUST have RLS enabled with appropriate policies:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (created_by = auth.uid());

-- Templates: readable by all authenticated, writable by admins
CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage templates"
  ON templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
```

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
]
```

## Compliance Requirements

| Requirement | How Met | Evidence |
|-------------|---------|----------|
| Data encryption at rest | Supabase default | Supabase documentation |
| Data encryption in transit | HTTPS enforced | Railway + Supabase |
| Access control | RLS + role checks | Code review |
| Audit logging | Supabase logs | Dashboard |

## Security Incident Response

1. **Identify:** Determine scope and type of incident
2. **Contain:** Rotate compromised credentials immediately
3. **Investigate:** Review logs to understand impact
4. **Remediate:** Fix vulnerability, patch systems
5. **Communicate:** Notify affected users if data breach
6. **Document:** Record incident and lessons learned

### Emergency Contacts
- Supabase Support: https://supabase.com/support
- Anthropic Support: https://console.anthropic.com/
- Railway Support: https://railway.app/help

## Security Checklist (Before Deploy)

- [ ] All environment variables set in Railway
- [ ] RLS policies enabled on all tables
- [ ] No API keys in codebase
- [ ] Authentication required on all protected routes
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose internals
