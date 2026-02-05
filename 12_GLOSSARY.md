# Glossary

## Domain Terms

| Term | Definition | Example in Context |
|------|-----------|-------------------|
| Sitemap | A structured map of all pages on a website, showing hierarchy and relationships | "Generate a sitemap for the client's restoration business" |
| Wireframe | Visual representation of a website's page structure (used interchangeably with sitemap in this app) | "The wireframe shows 45 pages across 3 levels" |
| Template | Pre-defined page structure for a specific industry (e.g., restoration, legal) | "Select the Restoration Company template to start" |
| Service Page | A page dedicated to a specific service offering | "Water Damage Restoration is a service page" |
| Location Page | A page targeting a specific geographic area | "The /miami/ page targets Miami customers" |
| Service-Location Page | A combined page targeting both a service and location | "Miami Water Damage targets water damage services in Miami" |
| Service Area | Geographic region where a business operates | "The client's service areas include Miami-Dade and Broward counties" |
| Crawl | The process of fetching and parsing a website's sitemap.xml | "Crawl the client's site to find existing pages" |
| Matrix | The combination of all services × all locations | "Generate a matrix of 5 services across 10 cities = 50 pages" |
| Node | A single page/block in the sitemap tree | "Each node represents one page on the final site" |

## Technical Terms

| Term | Definition | Where Used |
|------|-----------|------------|
| RLS (Row Level Security) | PostgreSQL feature that restricts data access per row | Database security |
| JWT (JSON Web Token) | Token format used for authentication sessions | Supabase Auth |
| SSR (Server-Side Rendering) | Rendering pages on the server before sending to client | Next.js pages |
| API Route | Server-side endpoint in Next.js | `/api/projects`, `/api/crawl` |
| Slug | URL-friendly version of a name (lowercase, hyphens) | `/water-damage`, `/miami` |
| JSONB | PostgreSQL binary JSON column type | Template structure storage |
| Middleware | Code that runs between request and response | Auth protection |
| Hydration | Process of making server-rendered HTML interactive | React/Next.js |

## Abbreviations

| Abbreviation | Full Term | Context |
|--------------|-----------|---------|
| SEO | Search Engine Optimization | The primary users are SEO engineers |
| CRUD | Create, Read, Update, Delete | Standard database operations |
| UI | User Interface | Frontend components |
| UX | User Experience | Design and flow |
| API | Application Programming Interface | Backend endpoints |
| DB | Database | Supabase PostgreSQL |
| CSV | Comma-Separated Values | Export format |
| JSON | JavaScript Object Notation | Data interchange format |
| URL | Uniform Resource Locator | Web addresses |
| LLM | Large Language Model | Claude AI |

## Entity Names

| Code Name | Display Name | Description |
|-----------|--------------|-------------|
| `users` | Users | Application users (SEO engineers, admins) |
| `templates` | Templates | Industry-specific page structures |
| `projects` | Projects | Client sitemap projects |
| `sitemap_nodes` | Sitemap Nodes / Pages | Individual pages in a sitemap |
| `services_config` | Service Configuration | Which services are enabled for a project |
| `locations` | Locations / Service Areas | Cities/counties the client serves |

## Status Values

### Project Status
| Status | Meaning | Transitions To |
|--------|---------|----------------|
| `draft` | Initial state, being configured | `crawled` |
| `crawled` | Client site has been crawled | `compared` |
| `compared` | AI comparison completed | `finalized` |
| `finalized` | Ready for export | `archived` |
| `archived` | Project archived (hidden) | `draft` (if restored) |

### Node Source
| Source | Meaning | Display |
|--------|---------|---------|
| `template` | Page from selected template | Blue color (#3B82F6) |
| `client` | Page imported from client site | Orange color (#F97316) |

### Page Types
| Type | Meaning | Example |
|------|---------|---------|
| `standard` | Regular static page | Home, About, Contact |
| `service` | Service offering page | Water Damage, Fire Damage |
| `location` | Geographic targeting page | /miami/, /boca-raton/ |
| `service_location` | Combined service + location | /miami/water-damage/ |

## User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Administrator | `admin` | Full access: templates, all projects, user management |
| Standard User | `user` | Own projects only, read-only templates |

## Color Coding

| Color | Hex | Usage |
|-------|-----|-------|
| Blue | #3B82F6 | Template-sourced nodes |
| Orange | #F97316 | Client-sourced nodes |
| Green | #22C55E | Success states, completed |
| Red | #EF4444 | Error states, destructive actions |
| Gray | #6B7280 | Disabled, secondary |

## URL Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `/` | Homepage | site.com/ |
| `/[service]/` | Service page at root | site.com/water-damage/ |
| `/[location]/` | Location page | site.com/miami/ |
| `/[location]/[service]/` | Service in location | site.com/miami/water-damage/ |
| `/service-areas/` | Service areas index | site.com/service-areas/ |
| `/service-areas/[location]/` | Service area detail | site.com/service-areas/miami/ |
