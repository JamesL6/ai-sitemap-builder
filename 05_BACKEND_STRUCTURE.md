# Backend Structure

## Directory Tree

```
ai-sitemap-builder/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── templates/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── me/
│   │   │       └── route.ts
│   │   ├── templates/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── [nodeId]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── bulk/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── export/
│   │   │   │   │   ├── csv/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── json/
│   │   │   │   │       └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── crawl/
│   │   │   └── route.ts
│   │   └── ai/
│   │       └── compare/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ... (shadcn components)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── CreateProjectForm.tsx
│   │   │   └── ProjectSettings.tsx
│   │   ├── templates/
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── TemplateEditor.tsx
│   │   ├── sitemap/
│   │   │   ├── SitemapViewer.tsx
│   │   │   ├── SitemapNode.tsx
│   │   │   ├── NodeEditor.tsx
│   │   │   └── SitemapToolbar.tsx
│   │   ├── crawler/
│   │   │   ├── CrawlForm.tsx
│   │   │   └── CrawlResults.tsx
│   │   ├── services/
│   │   │   ├── ServiceConfig.tsx
│   │   │   └── ServiceToggle.tsx
│   │   └── locations/
│   │       ├── LocationInput.tsx
│   │       └── LocationList.tsx
│   └── layouts/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── DashboardLayout.tsx
│       └── AuthLayout.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── admin.ts
│   ├── claude/
│   │   ├── client.ts
│   │   ├── compare.ts
│   │   └── prompts.ts
│   ├── crawler/
│   │   ├── sitemap.ts
│   │   ├── parser.ts
│   │   └── fetcher.ts
│   ├── utils/
│   │   ├── api-response.ts
│   │   ├── validation.ts
│   │   ├── url.ts
│   │   └── export.ts
│   └── constants.ts
├── types/
│   ├── database.ts
│   ├── api.ts
│   ├── sitemap.ts
│   └── index.ts
├── hooks/
│   ├── useProjects.ts
│   ├── useTemplates.ts
│   ├── useSitemap.ts
│   └── useAuth.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
└── README.md
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `SitemapViewer.tsx` |
| Utility files | camelCase | `apiResponse.ts` |
| API route folders | kebab-case | `app/api/sitemap-nodes/` |
| Database tables | snake_case | `sitemap_nodes` |
| TypeScript types | PascalCase | `type Project = {...}` |
| Hooks | camelCase with use prefix | `useProjects.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CRAWL_PAGES` |

## Code Patterns

### API Route Pattern (COPY THIS)
```typescript
// app/api/[resource]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'

export async function GET(request: NextRequest) {
  try {
    // 1. Create Supabase client
    const supabase = await createClient()
    
    // 2. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // 3. Parse query parameters (if needed)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // 4. Perform database operation
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)
      .limit(limit)

    if (error) throw error

    // 5. Return success response
    return apiResponse(data)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // 2. Parse and validate body
    const body = await request.json()
    
    // 3. Validate input (use Zod)
    // const validated = schema.parse(body)

    // 4. Perform database operation
    const { data, error } = await supabase
      .from('table_name')
      .insert({ ...body, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    // 5. Return created response
    return apiResponse(data, 201)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
```

### API Response Utility Pattern
```typescript
// lib/utils/api-response.ts
import { NextResponse } from 'next/server'

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  }, { status })
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({
    success: false,
    data: null,
    error: { code, message }
  }, { status })
}
```

### Crawler Service Pattern
```typescript
// lib/crawler/sitemap.ts
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import * as cheerio from 'cheerio'

interface CrawlResult {
  pages: PageInfo[]
  sitemapUrl: string
  crawledAt: string
}

interface PageInfo {
  url: string
  title: string
  lastModified?: string
}

export async function crawlSitemap(baseUrl: string): Promise<CrawlResult> {
  // 1. Normalize URL
  const normalizedUrl = normalizeUrl(baseUrl)
  
  // 2. Try common sitemap locations
  const sitemapUrls = [
    `${normalizedUrl}/sitemap.xml`,
    `${normalizedUrl}/sitemap_index.xml`,
    `${normalizedUrl}/sitemap/sitemap.xml`,
  ]
  
  let sitemapContent: string | null = null
  let foundSitemapUrl: string = ''
  
  for (const url of sitemapUrls) {
    try {
      const response = await axios.get(url, { timeout: 10000 })
      sitemapContent = response.data
      foundSitemapUrl = url
      break
    } catch {
      continue
    }
  }
  
  if (!sitemapContent) {
    throw new Error('CRAWL_NO_SITEMAP')
  }
  
  // 3. Parse sitemap XML
  const parsed = await parseStringPromise(sitemapContent)
  const urls = extractUrls(parsed)
  
  // 4. Fetch page titles (optional, rate-limited)
  const pages = await enrichWithTitles(urls)
  
  return {
    pages,
    sitemapUrl: foundSitemapUrl,
    crawledAt: new Date().toISOString()
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase()
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`
  }
  return normalized.replace(/\/$/, '')
}

function extractUrls(parsed: any): string[] {
  // Handle sitemap index
  if (parsed.sitemapindex) {
    // Would need to recursively fetch child sitemaps
    return parsed.sitemapindex.sitemap.map((s: any) => s.loc[0])
  }
  
  // Handle regular sitemap
  if (parsed.urlset) {
    return parsed.urlset.url.map((u: any) => u.loc[0])
  }
  
  return []
}

async function enrichWithTitles(urls: string[]): Promise<PageInfo[]> {
  // Rate-limit: max 5 concurrent, 200ms delay between batches
  const results: PageInfo[] = []
  const batchSize = 5
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await axios.get(url, { timeout: 5000 })
          const $ = cheerio.load(response.data)
          return {
            url,
            title: $('title').text().trim() || extractTitleFromUrl(url)
          }
        } catch {
          return { url, title: extractTitleFromUrl(url) }
        }
      })
    )
    results.push(...batchResults)
    
    // Rate limit delay
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}

function extractTitleFromUrl(url: string): string {
  const path = new URL(url).pathname
  const slug = path.split('/').filter(Boolean).pop() || 'Home'
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
```

### Claude Comparison Pattern
```typescript
// lib/claude/compare.ts
import Anthropic from '@anthropic-ai/sdk'
import { COMPARISON_PROMPT } from './prompts'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
})

export interface ComparisonResult {
  matches: Array<{
    templatePage: string
    clientPage: { title: string; url: string }
    confidence: number
  }>
  templateOnly: string[]
  clientOnly: Array<{
    title: string
    url: string
    suggestedCategory: string
  }>
  uncertain: Array<{
    templatePage: string
    clientPage: { title: string; url: string }
    reason: string
  }>
  tokensUsed: number
}

export async function comparePages(
  templatePages: string[],
  clientPages: Array<{ title: string; url: string }>
): Promise<ComparisonResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: COMPARISON_PROMPT
          .replace('{{TEMPLATE_PAGES}}', JSON.stringify(templatePages, null, 2))
          .replace('{{CLIENT_PAGES}}', JSON.stringify(clientPages, null, 2))
      }
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response format')
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) {
    throw new Error('Could not parse comparison result')
  }

  const result = JSON.parse(jsonMatch[1])
  
  return {
    ...result,
    tokensUsed: message.usage.input_tokens + message.usage.output_tokens
  }
}
```

### Claude Prompts
```typescript
// lib/claude/prompts.ts
export const COMPARISON_PROMPT = `
You are an expert at analyzing website structures. Compare these template pages with client pages and identify matches.

TEMPLATE PAGES (our standard structure):
{{TEMPLATE_PAGES}}

CLIENT PAGES (from their existing website):
{{CLIENT_PAGES}}

RULES:
1. "Water Damage" and "Water Damage Restoration" are the SAME intent - mark as match
2. "Water Extraction", "Water Mitigation", "Flood Cleanup" are DIFFERENT from "Water Damage" - these are sub-services
3. Consider semantic meaning, not just exact text matching
4. For client-only pages, suggest a category: "standard", "service", "location", or "other"

Return JSON in this exact format:
\`\`\`json
{
  "matches": [
    { "templatePage": "string", "clientPage": { "title": "string", "url": "string" }, "confidence": 0.95 }
  ],
  "templateOnly": ["page names not found on client site"],
  "clientOnly": [
    { "title": "string", "url": "string", "suggestedCategory": "standard|service|location|other" }
  ],
  "uncertain": [
    { "templatePage": "string", "clientPage": { "title": "string", "url": "string" }, "reason": "why uncertain" }
  ]
}
\`\`\`

Be thorough but conservative with matches. When in doubt, put in "uncertain".
`
```

### Error Handling Pattern
```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.statusCode)
  }
  
  console.error('Unhandled error:', error)
  return apiError('SYS_INTERNAL', 'An unexpected error occurred', 500)
}
```

### Validation Pattern (Zod)
```typescript
// lib/utils/validation.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  client_url: z.string().url().optional().or(z.literal('')),
  template_id: z.string().uuid().optional().nullable(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const crawlRequestSchema = z.object({
  project_id: z.string().uuid(),
  url: z.string().url('Invalid URL format'),
})

export const locationSchema = z.object({
  name: z.string().min(1),
  url_slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
})

export const locationsInputSchema = z.array(locationSchema)
```

## Environment Variable Access
```typescript
// lib/constants.ts
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  crawl: {
    maxPages: 200,
    timeoutMs: 30000,
    rateLimitMs: 200,
  },
} as const

// Validate required env vars at startup
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLAUDE_API_KEY',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```
