# AI Sitemap Builder - Requirements

## One-Line Summary
AI-powered tool that generates website sitemaps by comparing client sites against company templates.

## Problem Statement
- **Who:** Local SEO Engineers and Operations Managers
- **Problem:** Creating website sitemaps is time-consuming, requiring manual crawling, comparison against templates, and accounting for client-specific pages that don't fit standard structures
- **Solution:** Automate sitemap generation by crawling client sites, using AI to match pages semantically, and generating visual wireframes with proper location×service matrices

## User Roles

| Role | Description | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| Admin | System administrator | Create/edit/delete templates, all user permissions, view API usage | N/A |
| User | SEO Engineer or Ops Manager | Create projects, select templates, crawl sites, generate sitemaps, export data | Manage templates, view other users' projects |

## Features (MVP)

| ID | Feature | User Story | Acceptance Criteria | Priority |
|----|---------|-----------|---------------------|----------|
| F01 | User Authentication | As a user, I can log in so that I can access my projects | Users can register, login, logout; sessions persist | P0 |
| F02 | Project Dashboard | As a user, I can see all my projects so that I can manage them | List view shows project name, date, status; can create/delete | P0 |
| F03 | Template Selection | As a user, I can select a template so that I have a starting structure | Dropdown/list of available templates; preview option | P0 |
| F04 | Website Crawling | As a user, I can enter a URL so that the system crawls the sitemap | System fetches sitemap.xml, parses pages, displays results | P0 |
| F05 | Service Configuration | As a user, I can select which services the client offers so that the sitemap reflects their business | Toggle list of services; add custom services | P0 |
| F06 | Location Input | As a user, I can paste a list of cities so that location pages are generated | Text area for paste; parses into list; generates matrix | P0 |
| F07 | AI Page Comparison | As a user, I can compare client pages to template so that matches are identified | AI identifies matches, gaps, unique pages; confidence scores | P0 |
| F08 | Visual Sitemap | As a user, I can view the sitemap visually so that I understand the structure | Tree view with nested blocks; color-coded by source | P0 |
| F09 | CSV Export | As a user, I can export to CSV so that I can use the data in Google Sheets | Download button; nested structure preserved; includes URLs | P0 |
| F10 | Project Save | As a user, I can save my project so that I can return to it later | Save button; projects persist; load from dashboard | P0 |
| F11 | Template Management | As an admin, I can create templates so that users have starting structures | CRUD interface for templates; define pages, services, URL patterns | P0 |

## Features (Post-MVP)

| ID | Feature | Rationale for Deferral |
|----|---------|----------------------|
| F12 | AI Clarification Questions | Adds complexity; start with confidence thresholds first |
| F13 | Visual Export (PNG/PDF) | CSV covers immediate need; visual export is nice-to-have |
| F14 | API Cost Dashboard | Can monitor via Anthropic dashboard initially |
| F15 | Octopus/Miro Export | Custom visual sufficient for MVP |
| F16 | Bulk Location Import | Copy-paste sufficient for ~5 sites/month |
| F17 | Team Collaboration | Single-user projects sufficient for MVP |

## Out of Scope (Explicit)
- **Full website content crawling** - Only sitemap/page structure, not full page content analysis
- **SEO recommendations** - This tool generates structure, not SEO advice
- **Direct Miro/ClickUp integration** - Export formats cover the need
- **Mobile app** - Web-only for this use case
- **Multi-tenancy** - Single organization use

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to create sitemap | < 15 minutes (down from 1-2 hours) | User feedback, session timing |
| User adoption | 100% of SEO team using within 1 month | Login tracking |
| Accuracy of AI matching | > 90% correct matches | Spot-check reviews |
| API cost per sitemap | < $10 average | Anthropic dashboard |

## Constraints
- **Budget:** ~$50/month for Claude API
- **Volume:** ~5 websites per month
- **Templates:** < 5 industry templates initially
- **Team Size:** < 10 users
- **Compliance:** No specific compliance requirements (internal tool)
