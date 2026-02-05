# Implementation Plan

## Phase Overview

| Phase | Name | Dependencies | Deliverables |
|-------|------|--------------|--------------|
| 1 | Foundation & Authentication | None | Project setup, Supabase, auth, basic UI |
| 2 | Core Data & Templates | Phase 1 | Database schema, template CRUD, project CRUD |
| 3 | Crawling & AI Comparison | Phase 2 | Crawler service, Claude integration, comparison |
| 4 | Visualization & Export | Phase 3 | Visual sitemap, color coding, CSV export |

---

## Phase 1: Foundation & Authentication
**Goal:** Set up project infrastructure and user authentication
**Success Criteria:** Users can register, login, and see a dashboard

### Tasks
- [x] **1.1:** Initialize Next.js project with TypeScript
  - Files: `package.json`, `tsconfig.json`, `next.config.js`
  - Docs to update: None
  - Dependencies: None

- [x] **1.2:** Set up Tailwind CSS and shadcn/ui
  - Files: `tailwind.config.ts`, `globals.css`, `components/ui/*`
  - Docs to update: None
  - Dependencies: 1.1

- [x] **1.3:** Create Supabase project and get credentials
  - Files: `.env.local`, `.env.example`
  - Docs to update: `07_DEVELOPMENT_ENVIRONMENT.md`
  - Dependencies: None

- [x] **1.4:** Implement Supabase client utilities
  - Files: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
  - Docs to update: None
  - Dependencies: 1.3

- [ ] **1.5:** Create auth middleware
  - Files: `middleware.ts`
  - Docs to update: None
  - Dependencies: 1.4

- [ ] **1.6:** Build Login page
  - Files: `app/(auth)/login/page.tsx`, `components/features/auth/LoginForm.tsx`
  - Docs to update: None
  - Dependencies: 1.2, 1.4

- [ ] **1.7:** Build Register page
  - Files: `app/(auth)/register/page.tsx`, `components/features/auth/RegisterForm.tsx`
  - Docs to update: None
  - Dependencies: 1.6

- [ ] **1.8:** Create dashboard layout
  - Files: `app/(dashboard)/layout.tsx`, `components/layouts/DashboardLayout.tsx`, `components/layouts/Header.tsx`, `components/layouts/Sidebar.tsx`
  - Docs to update: None
  - Dependencies: 1.5

- [ ] **1.9:** Build empty dashboard page
  - Files: `app/(dashboard)/page.tsx`
  - Docs to update: None
  - Dependencies: 1.8

- [x] **1.10:** Set up GitHub repository
  - Files: `.gitignore`, `README.md`
  - Docs to update: None
  - Dependencies: 1.1

- [ ] **1.11:** Configure Railway project
  - Files: None (Railway dashboard)
  - Docs to update: `07_DEVELOPMENT_ENVIRONMENT.md`
  - Dependencies: 1.10

### Phase 1 Completion Checklist
- [ ] Users can register with email/password
- [ ] Users can login/logout
- [ ] Protected routes redirect to login
- [ ] Dashboard shows for authenticated users
- [ ] App deploys to Railway successfully

---

## Phase 2: Core Data & Templates
**Goal:** Implement database schema and template management
**Success Criteria:** Admins can create templates, users can create projects

### Tasks
- [ ] **2.1:** Create database migrations for users table extension
  - Files: `supabase/migrations/001_users.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: Phase 1

- [ ] **2.2:** Create database migrations for templates table
  - Files: `supabase/migrations/002_templates.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.1

- [ ] **2.3:** Create database migrations for projects table
  - Files: `supabase/migrations/003_projects.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.1

- [ ] **2.4:** Create database migrations for sitemap_nodes table
  - Files: `supabase/migrations/004_sitemap_nodes.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.3

- [ ] **2.5:** Set up Row Level Security policies
  - Files: `supabase/migrations/005_rls_policies.sql`
  - Docs to update: `08_SECURITY_GUIDELINES.md`
  - Dependencies: 2.1, 2.2, 2.3, 2.4

- [ ] **2.6:** Generate TypeScript types from Supabase
  - Files: `types/database.ts`
  - Docs to update: None
  - Dependencies: 2.5

- [ ] **2.7:** Build GET /api/auth/me endpoint
  - Files: `app/api/auth/me/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [ ] **2.8:** Build templates API endpoints (CRUD)
  - Files: `app/api/templates/route.ts`, `app/api/templates/[id]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [ ] **2.9:** Build Template List page (admin)
  - Files: `app/(dashboard)/templates/page.tsx`, `components/features/templates/TemplateList.tsx`, `components/features/templates/TemplateCard.tsx`
  - Docs to update: None
  - Dependencies: 2.8

- [ ] **2.10:** Build Template Editor page (admin)
  - Files: `app/(dashboard)/templates/[id]/page.tsx`, `components/features/templates/TemplateEditor.tsx`
  - Docs to update: None
  - Dependencies: 2.9

- [ ] **2.11:** Build projects API endpoints (CRUD)
  - Files: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [ ] **2.12:** Build Project List on Dashboard
  - Files: `components/features/projects/ProjectList.tsx`, `components/features/projects/ProjectCard.tsx`
  - Docs to update: None
  - Dependencies: 2.11

- [ ] **2.13:** Build Create Project flow
  - Files: `app/(dashboard)/projects/new/page.tsx`, `components/features/projects/CreateProjectForm.tsx`, `components/features/templates/TemplateSelector.tsx`
  - Docs to update: None
  - Dependencies: 2.12

- [ ] **2.14:** Seed initial template data
  - Files: `supabase/seed.sql` or `scripts/seed.ts`
  - Docs to update: None
  - Dependencies: 2.2

### Phase 2 Completion Checklist
- [ ] Database schema matches `03_DATA_MODELS.md`
- [ ] RLS policies prevent unauthorized access
- [ ] Admins can create/edit/delete templates
- [ ] Users can create/view/delete projects
- [ ] Template selector works in project creation
- [ ] At least 1 template seeded for testing

---

## Phase 3: Crawling & AI Comparison
**Goal:** Implement website crawling and AI-powered page comparison
**Success Criteria:** System can crawl sites and identify matching pages

### Tasks
- [ ] **3.1:** Build sitemap crawler utility
  - Files: `lib/crawler/sitemap.ts`, `lib/crawler/parser.ts`, `lib/crawler/fetcher.ts`
  - Docs to update: None
  - Dependencies: Phase 2

- [ ] **3.2:** Build POST /api/crawl endpoint
  - Files: `app/api/crawl/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 3.1

- [ ] **3.3:** Build Crawl Form component
  - Files: `components/features/crawler/CrawlForm.tsx`, `components/features/crawler/CrawlResults.tsx`
  - Docs to update: None
  - Dependencies: 3.2

- [ ] **3.4:** Build Claude API client
  - Files: `lib/claude/client.ts`, `lib/claude/prompts.ts`
  - Docs to update: None
  - Dependencies: None

- [ ] **3.5:** Build page comparison function
  - Files: `lib/claude/compare.ts`
  - Docs to update: None
  - Dependencies: 3.4

- [ ] **3.6:** Build POST /api/ai/compare endpoint
  - Files: `app/api/ai/compare/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 3.5

- [ ] **3.7:** Build Service Configuration component
  - Files: `components/features/services/ServiceConfig.tsx`, `components/features/services/ServiceToggle.tsx`
  - Docs to update: None
  - Dependencies: Phase 2

- [ ] **3.8:** Build Location Input component
  - Files: `components/features/locations/LocationInput.tsx`, `components/features/locations/LocationList.tsx`
  - Docs to update: None
  - Dependencies: Phase 2

- [ ] **3.9:** Build location × service matrix generator
  - Files: `lib/utils/matrix.ts`
  - Docs to update: None
  - Dependencies: 3.7, 3.8

- [ ] **3.10:** Build sitemap nodes API endpoints
  - Files: `app/api/projects/[id]/nodes/route.ts`, `app/api/projects/[id]/nodes/bulk/route.ts`, `app/api/projects/[id]/nodes/[nodeId]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [ ] **3.11:** Integrate crawl + compare + matrix into project editor
  - Files: `app/(dashboard)/projects/[id]/page.tsx` (update)
  - Docs to update: None
  - Dependencies: 3.3, 3.6, 3.9, 3.10

### Phase 3 Completion Checklist
- [ ] Crawler fetches and parses sitemap.xml
- [ ] Crawler handles missing sitemaps gracefully
- [ ] Claude comparison returns matches/gaps
- [ ] Services can be toggled on/off
- [ ] Locations can be pasted and parsed
- [ ] Location × service matrix generates correctly
- [ ] Sitemap nodes saved to database

---

## Phase 4: Visualization & Export
**Goal:** Build visual sitemap display and export functionality
**Success Criteria:** Users see color-coded sitemap and can export to CSV

### Tasks
- [ ] **4.1:** Build SitemapNode component
  - Files: `components/features/sitemap/SitemapNode.tsx`
  - Docs to update: None
  - Dependencies: Phase 3

- [ ] **4.2:** Build SitemapViewer component (tree view)
  - Files: `components/features/sitemap/SitemapViewer.tsx`
  - Docs to update: None
  - Dependencies: 4.1

- [ ] **4.3:** Implement color coding (template vs client)
  - Files: `components/features/sitemap/SitemapNode.tsx` (update)
  - Docs to update: None
  - Dependencies: 4.2

- [ ] **4.4:** Build node editing inline
  - Files: `components/features/sitemap/NodeEditor.tsx`
  - Docs to update: None
  - Dependencies: 4.2

- [ ] **4.5:** Build SitemapToolbar (actions bar)
  - Files: `components/features/sitemap/SitemapToolbar.tsx`
  - Docs to update: None
  - Dependencies: 4.2

- [ ] **4.6:** Build CSV export utility
  - Files: `lib/utils/export.ts`
  - Docs to update: None
  - Dependencies: Phase 3

- [ ] **4.7:** Build GET /api/projects/[id]/export/csv endpoint
  - Files: `app/api/projects/[id]/export/csv/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 4.6

- [ ] **4.8:** Build GET /api/projects/[id]/export/json endpoint
  - Files: `app/api/projects/[id]/export/json/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 4.6

- [ ] **4.9:** Add export buttons to toolbar
  - Files: `components/features/sitemap/SitemapToolbar.tsx` (update)
  - Docs to update: None
  - Dependencies: 4.5, 4.7, 4.8

- [ ] **4.10:** Build project save functionality
  - Files: `app/(dashboard)/projects/[id]/page.tsx` (update)
  - Docs to update: None
  - Dependencies: 4.2

- [ ] **4.11:** Add client URL display on imported nodes
  - Files: `components/features/sitemap/SitemapNode.tsx` (update)
  - Docs to update: None
  - Dependencies: 4.3

- [ ] **4.12:** Final UI polish and testing
  - Files: Various
  - Docs to update: None
  - Dependencies: All above

### Phase 4 Completion Checklist
- [ ] Sitemap displays as nested tree
- [ ] Template nodes show in blue
- [ ] Client nodes show in orange with original URL
- [ ] Nodes can be edited inline
- [ ] CSV export downloads correctly
- [ ] JSON export works
- [ ] Projects persist between sessions
- [ ] All error states handled gracefully

---

## Rollback Procedures

| Phase | If Fails | Rollback Steps |
|-------|----------|----------------|
| 1 | Project setup issues | Delete and recreate project |
| 2 | Schema migration fails | `supabase db reset`, fix migration, retry |
| 3 | Crawler/AI not working | Disable features, allow manual entry |
| 4 | Visualization broken | Fall back to simple list view |

---

## Post-MVP Roadmap

After completing all 4 phases:

1. **AI Clarification Questions** - When AI is uncertain, prompt user
2. **Visual Export (PNG/PDF)** - Export sitemap as image
3. **API Cost Dashboard** - Track Claude usage per project
4. **Bulk Location Import** - Import from Google Sheets directly
5. **Team Collaboration** - Share projects between users

---
⚠️ **AI INSTRUCTION:** When completing a task, CHECK THE BOX and update `PROJECT_STATE.json` and `11_TASKS.json`.
