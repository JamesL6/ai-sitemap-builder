# Implementation Plan

## Phase Overview

| Phase | Name | Dependencies | Status | Deliverables |
|-------|------|--------------|--------|--------------|
| 1 | Foundation & Authentication | None | ✅ COMPLETE | Project setup, Supabase, auth, basic UI |
| 2 | Core Data & Templates | Phase 1 | ✅ COMPLETE | Database schema, template CRUD, project CRUD |
| 3 | Crawling & AI Comparison | Phase 2 | ✅ COMPLETE | Crawler service, Claude integration, comparison |
| 4 | Visualization & Export | Phase 3 | ✅ COMPLETE | Visual sitemap, color coding, CSV export |
| 5 | Template Builder Enhancement | Phase 4 | ✅ COMPLETE | Multi-level hierarchies, visual page builder |

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

- [x] **1.5:** Create auth middleware
  - Files: `middleware.ts`
  - Docs to update: None
  - Dependencies: 1.4

- [x] **1.6:** Build Login page
  - Files: `app/(auth)/login/page.tsx`, `components/features/auth/LoginForm.tsx`
  - Docs to update: None
  - Dependencies: 1.2, 1.4

- [x] **1.7:** Build Register page
  - Files: `app/(auth)/register/page.tsx`, `components/features/auth/RegisterForm.tsx`
  - Docs to update: None
  - Dependencies: 1.6

- [x] **1.8:** Create dashboard layout
  - Files: `app/(dashboard)/layout.tsx`, `components/layouts/DashboardLayout.tsx`, `components/layouts/Header.tsx`, `components/layouts/Sidebar.tsx`
  - Docs to update: None
  - Dependencies: 1.5

- [x] **1.9:** Build empty dashboard page
  - Files: `app/(dashboard)/page.tsx`
  - Docs to update: None
  - Dependencies: 1.8

- [x] **1.10:** Set up GitHub repository
  - Files: `.gitignore`, `README.md`
  - Docs to update: None
  - Dependencies: 1.1

- [x] **1.11:** Configure Railway project
  - Files: None (Railway dashboard)
  - Docs to update: `07_DEVELOPMENT_ENVIRONMENT.md`
  - Dependencies: 1.10

### Phase 1 Completion Checklist
- [x] Users can register with email/password
- [x] Users can login/logout
- [x] Protected routes redirect to login
- [x] Dashboard shows for authenticated users
- [x] App deploys to Railway successfully

### Phase 1 COMPLETE ✅ (11/11 tasks done)

---

## Phase 2: Core Data & Templates
**Goal:** Implement database schema and template management
**Success Criteria:** Admins can create templates, users can create projects

### Tasks
- [x] **2.1:** Create database migrations for users table extension
  - Files: `supabase/migrations/001_create_users_extension.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: Phase 1

- [x] **2.2:** Create database migrations for templates table
  - Files: `supabase/migrations/002_create_templates.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.1

- [x] **2.3:** Create database migrations for projects table
  - Files: `supabase/migrations/003_create_projects.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.1

- [x] **2.4:** Create database migrations for sitemap_nodes table
  - Files: `supabase/migrations/004_create_sitemap_nodes.sql`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: 2.3

- [x] **2.5:** Set up Row Level Security policies
  - Files: `supabase/migrations/005_create_rls_policies.sql`
  - Docs to update: `08_SECURITY_GUIDELINES.md`
  - Dependencies: 2.1, 2.2, 2.3, 2.4

- [x] **2.6:** Generate TypeScript types from Supabase
  - Files: `types/database.ts`
  - Docs to update: None
  - Dependencies: 2.5

- [x] **2.7:** Build GET /api/auth/me endpoint
  - Files: `app/api/auth/me/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [x] **2.8:** Build templates API endpoints (CRUD)
  - Files: `app/api/templates/route.ts`, `app/api/templates/[id]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [x] **2.9:** Build Template List page (admin)
  - Files: `app/(dashboard)/templates/page.tsx`, `components/features/templates/TemplateList.tsx`, `components/features/templates/TemplateCard.tsx`
  - Docs to update: None
  - Dependencies: 2.8

- [x] **2.10:** Build Template Editor page (admin)
  - Files: `app/(dashboard)/templates/[id]/page.tsx`
  - Docs to update: None
  - Dependencies: 2.9

- [x] **2.11:** Build projects API endpoints (CRUD)
  - Files: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [x] **2.12:** Build Project List on Dashboard
  - Files: `components/features/projects/ProjectList.tsx`, `components/features/projects/ProjectCard.tsx`
  - Docs to update: None
  - Dependencies: 2.11

- [x] **2.13:** Build Create Project flow
  - Files: `app/(dashboard)/projects/new/page.tsx`, `components/features/projects/CreateProjectForm.tsx`, `components/features/templates/TemplateSelector.tsx`
  - Docs to update: None
  - Dependencies: 2.12

- [x] **2.14:** Seed initial template data
  - Files: `supabase/seed.sql`
  - Docs to update: None
  - Dependencies: 2.2

### Phase 2 Completion Checklist
- [x] Database schema matches `03_DATA_MODELS.md`
- [x] RLS policies prevent unauthorized access
- [x] Admins can create/edit/delete templates
- [x] Users can create/view/delete projects
- [x] Template selector works in project creation
- [x] At least 1 template seeded for testing (3 templates in seed.sql)

### Phase 2 COMPLETE ✅ (14/14 tasks done)

---

## Phase 3: Crawling & AI Comparison
**Goal:** Implement website crawling and AI-powered page comparison
**Success Criteria:** System can crawl sites and identify matching pages

### Tasks
- [x] **3.1:** Build sitemap crawler utility
  - Files: `lib/crawler/sitemap.ts`, `lib/crawler/parser.ts`, `lib/crawler/fetcher.ts`
  - Docs to update: None
  - Dependencies: Phase 2

- [x] **3.2:** Build POST /api/crawl endpoint
  - Files: `app/api/crawl/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 3.1

- [x] **3.3:** Build Crawl Form component
  - Files: `components/features/crawler/CrawlForm.tsx`, `components/features/crawler/CrawlResults.tsx`
  - Docs to update: None
  - Dependencies: 3.2

- [x] **3.4:** Build Claude API client
  - Files: `lib/claude/client.ts`, `lib/claude/prompts.ts`
  - Docs to update: None
  - Dependencies: None

- [x] **3.5:** Build page comparison function
  - Files: `lib/claude/compare.ts`
  - Docs to update: None
  - Dependencies: 3.4

- [x] **3.6:** Build POST /api/ai/compare endpoint
  - Files: `app/api/ai/compare/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 3.5

- [x] **3.7:** Build Service Configuration component
  - Files: `components/features/services/ServiceConfig.tsx`, `components/features/services/ServiceToggle.tsx`
  - Docs to update: None
  - Dependencies: Phase 2

- [x] **3.8:** Build Location Input component
  - Files: `components/features/locations/LocationInput.tsx`, `components/features/locations/LocationList.tsx`
  - Docs to update: None
  - Dependencies: Phase 2

- [x] **3.9:** Build location × service matrix generator
  - Files: `lib/utils/matrix.ts`
  - Docs to update: None
  - Dependencies: 3.7, 3.8

- [x] **3.10:** Build sitemap nodes API endpoints
  - Files: `app/api/projects/[id]/nodes/route.ts`, `app/api/projects/[id]/nodes/bulk/route.ts`, `app/api/projects/[id]/nodes/[nodeId]/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 2.6

- [x] **3.11:** Integrate crawl + compare + matrix into project editor
  - Files: `app/(dashboard)/projects/[id]/page.tsx`, `components/features/projects/ProjectEditor.tsx`
  - Docs to update: None
  - Dependencies: 3.3, 3.6, 3.9, 3.10

### Phase 3 Completion Checklist
- [x] Crawler fetches and parses sitemap.xml
- [x] Crawler handles missing sitemaps gracefully
- [x] Claude comparison returns matches/gaps
- [x] Services can be toggled on/off
- [x] Locations can be pasted and parsed
- [x] Location × service matrix generates correctly
- [x] Sitemap nodes saved to database

### Phase 3 COMPLETE ✅ (11/11 tasks done)

---

## Phase 4: Visualization & Export
**Goal:** Build visual sitemap display and export functionality
**Success Criteria:** Users see color-coded sitemap and can export to CSV

### Tasks
- [x] **4.1:** Build SitemapNode component
  - Files: `components/features/sitemap/SitemapNode.tsx`
  - Docs to update: None
  - Dependencies: Phase 3

- [x] **4.2:** Build SitemapViewer component (tree view)
  - Files: `components/features/sitemap/SitemapViewer.tsx`
  - Docs to update: None
  - Dependencies: 4.1

- [x] **4.3:** Implement color coding (template vs client)
  - Files: `components/features/sitemap/SitemapNode.tsx` (built-in)
  - Docs to update: None
  - Dependencies: 4.2

- [x] **4.4:** Build node editing inline (CANCELLED - not needed for MVP)
  - Files: N/A
  - Docs to update: None
  - Dependencies: 4.2

- [x] **4.5:** Build SitemapToolbar (actions bar)
  - Files: `components/features/sitemap/SitemapToolbar.tsx`
  - Docs to update: None
  - Dependencies: 4.2

- [x] **4.6:** Build CSV export utility
  - Files: `lib/utils/export.ts`
  - Docs to update: None
  - Dependencies: Phase 3

- [x] **4.7:** Build GET /api/projects/[id]/export/csv endpoint
  - Files: `app/api/projects/[id]/export/csv/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 4.6

- [x] **4.8:** Build GET /api/projects/[id]/export/json endpoint
  - Files: `app/api/projects/[id]/export/json/route.ts`
  - Docs to update: `04_API_SPECIFICATION.md`
  - Dependencies: 4.6

- [x] **4.9:** Add export buttons to toolbar
  - Files: `components/features/sitemap/SitemapToolbar.tsx` (built-in)
  - Docs to update: None
  - Dependencies: 4.5, 4.7, 4.8

- [x] **4.10:** Build project save functionality
  - Files: `app/(dashboard)/projects/[id]/page.tsx`, `components/features/projects/ProjectEditor.tsx`
  - Docs to update: None
  - Dependencies: 4.2

- [x] **4.11:** Add client URL display on imported nodes
  - Files: `components/features/sitemap/SitemapNode.tsx` (built-in)
  - Docs to update: None
  - Dependencies: 4.3

- [x] **4.12:** Final UI polish and testing
  - Files: Various
  - Docs to update: None
  - Dependencies: All above

### Phase 4 Completion Checklist
- [x] Sitemap displays as nested tree
- [x] Template nodes show in blue
- [x] Client nodes show in orange with original URL
- [x] CSV export downloads correctly
- [x] JSON export works
- [x] Projects persist between sessions (auto-save)
- [x] All error states handled gracefully

### Phase 4 COMPLETE ✅ (12/12 tasks done)

---

## Phase 5: Template Builder Enhancement
**Goal:** Enable admins to create and edit custom templates with multi-level hierarchies
**Success Criteria:** Admins can build complex nested service structures

### Tasks
- [x] **5.1:** Remove ServiceManager, consolidate to PageBuilder
  - Files: `components/features/templates/builder/TemplateForm.tsx` (updated)
  - Docs to update: None
  - Dependencies: Phase 2

- [x] **5.2:** Add multiply_in_matrix flag support
  - Files: `types/database.ts`, `lib/utils/template-helpers.ts`
  - Docs to update: `03_DATA_MODELS.md`
  - Dependencies: Phase 4

- [x] **5.3:** Build visual PageBuilder with nesting
  - Files: `components/features/templates/builder/PageBuilder.tsx`
  - Docs to update: None
  - Dependencies: 5.1

- [x] **5.4:** Auto-generate URL patterns from titles
  - Files: `components/features/templates/builder/PageBuilder.tsx` (enhanced)
  - Docs to update: None
  - Dependencies: 5.3

- [x] **5.5:** Create template creation page
  - Files: `app/(dashboard)/templates/new/page.tsx`
  - Docs to update: None
  - Dependencies: 5.3

- [x] **5.6:** Update template edit page with editor
  - Files: `app/(dashboard)/templates/[id]/page.tsx` (updated)
  - Docs to update: None
  - Dependencies: 5.3

- [x] **5.7:** Update seed templates with hierarchical structures
  - Files: `supabase/seed.sql` (updated)
  - Docs to update: None
  - Dependencies: 5.2

- [x] **5.8:** Fix template editor redirect behavior
  - Files: `components/features/templates/builder/TemplateForm.tsx` (updated)
  - Docs to update: None
  - Dependencies: 5.6

- [x] **5.9:** Fix scrolling issues in dashboard layout
  - Files: `components/layouts/DashboardLayout.tsx` (updated)
  - Docs to update: None
  - Dependencies: None

### Phase 5 Completion Checklist
- [x] Admins can create new templates from scratch
- [x] Page builder supports unlimited nesting depth
- [x] Any page at any level can be marked to multiply by locations
- [x] URL patterns auto-generate from parent path + title slug
- [x] Template edits save without redirecting
- [x] No annoying save popups
- [x] Long forms scroll properly without layout issues
- [x] Seed templates updated with realistic hierarchies

### Phase 5 COMPLETE ✅ (9/9 tasks done)

**Example Template Structure Now Supported:**
```
Services
  └─ Water Damage Restoration [✓ Multiply]
      ├─ Flood Damage Cleanup [✓ Multiply]
      ├─ Water Extraction [✓ Multiply]
      └─ Water Mitigation [✓ Multiply]
```

---

## Rollback Procedures

| Phase | If Fails | Rollback Steps |
|-------|----------|----------------|
| 1 | Project setup issues | Delete and recreate project |
| 2 | Schema migration fails | `supabase db reset`, fix migration, retry |
| 3 | Crawler/AI not working | Disable features, allow manual entry |
| 4 | Visualization broken | Fall back to simple list view |

---

---

## Current Status: ALL PHASES COMPLETE ✅

**MVP is fully functional and deployed!**

### What's Working:
✅ User authentication and role-based access  
✅ Template management with visual builder  
✅ Multi-level service hierarchies (unlimited depth)  
✅ Project creation and management  
✅ Website crawling (sitemap.xml parser)  
✅ Claude AI page matching  
✅ Location × service matrix generation  
✅ Visual sitemap tree view with color coding  
✅ CSV and JSON export  
✅ Auto-save and real-time updates  

### Database:
✅ 4 tables with RLS policies  
✅ 3 seed templates (Restoration, HVAC, Plumbing)  
✅ All migrations applied  

### API:
✅ Auth endpoints  
✅ Template CRUD  
✅ Project CRUD  
✅ Sitemap nodes CRUD  
✅ Crawl endpoint  
✅ AI comparison endpoint  
✅ Export endpoints (CSV/JSON)  

---

## Post-MVP Enhancement Ideas

Optional improvements for future iterations:

1. **Inline Node Editing** - Edit sitemap nodes directly in tree view
2. **AI Clarification Questions** - When AI is uncertain, prompt user
3. **Visual Export (PNG/PDF)** - Export sitemap as image
4. **API Cost Dashboard** - Track Claude usage per project
5. **Bulk Location Import** - Import from Google Sheets directly
6. **Team Collaboration** - Share projects between users
7. **Template Duplication** - Clone existing templates
8. **Batch Operations** - Bulk edit/delete sitemap nodes

---
⚠️ **AI INSTRUCTION:** When completing a task, CHECK THE BOX and update `PROJECT_STATE.json` and `11_TASKS.json`.
