# API Specification

## Base Configuration
- **Base URL:** `/api` (relative to app domain)
- **Auth Method:** Supabase Auth (JWT in cookies)
- **Content-Type:** `application/json`

## Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-02-05T12:00:00.000Z"
  }
}
```

## Standard Error Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Endpoints

### Authentication

Authentication is handled by Supabase Auth. The following are helper endpoints.

#### GET /api/auth/me
**Purpose:** Get current authenticated user profile
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "created_at": "2025-02-05T12:00:00.000Z"
  }
}
```

**Errors:**
| Code | Error Key | When | Resolution |
|------|-----------|------|------------|
| 401 | AUTH_REQUIRED | No valid session | Login required |

---

### Templates

#### GET /api/templates
**Purpose:** List all available templates
**Auth Required:** Yes
**Roles Allowed:** Any authenticated (sees active only), Admin (sees all)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| include_inactive | boolean | No | Include inactive templates (admin only) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Restoration Company",
      "description": "Standard template for restoration businesses",
      "services": [
        { "id": "water-damage", "name": "Water Damage Restoration" }
      ],
      "is_active": true,
      "created_at": "2025-02-05T12:00:00.000Z"
    }
  ]
}
```

#### GET /api/templates/[id]
**Purpose:** Get single template with full structure
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Restoration Company",
    "description": "Standard template for restoration businesses",
    "structure": {
      "pages": [...]
    },
    "services": [...],
    "url_patterns": {},
    "is_active": true,
    "created_at": "2025-02-05T12:00:00.000Z"
  }
}
```

**Errors:**
| Code | Error Key | When | Resolution |
|------|-----------|------|------------|
| 404 | RES_NOT_FOUND | Template doesn't exist | Check template ID |

#### POST /api/templates
**Purpose:** Create new template
**Auth Required:** Yes
**Roles Allowed:** Admin only

**Request Body:**
```json
{
  "name": "string - Template name",
  "description": "string - Optional description",
  "structure": "object - Page structure (see schema)",
  "services": "array - Available services",
  "url_patterns": "object - URL pattern config"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Template",
    ...
  }
}
```

**Errors:**
| Code | Error Key | When | Resolution |
|------|-----------|------|------------|
| 400 | VAL_INVALID_INPUT | Invalid structure format | Check structure schema |
| 403 | AUTH_FORBIDDEN | User is not admin | Admin access required |

#### PUT /api/templates/[id]
**Purpose:** Update template
**Auth Required:** Yes
**Roles Allowed:** Admin only

**Request Body:** Same as POST (all fields optional)

**Response (200):** Updated template object

#### DELETE /api/templates/[id]
**Purpose:** Delete template
**Auth Required:** Yes
**Roles Allowed:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

### Projects

#### GET /api/projects
**Purpose:** List user's projects
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| limit | number | No | Results per page (default 20) |
| offset | number | No | Pagination offset |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ABC Restoration Sitemap",
      "client_url": "https://abcrestoration.com",
      "status": "draft",
      "template": {
        "id": "uuid",
        "name": "Restoration Company"
      },
      "created_at": "2025-02-05T12:00:00.000Z",
      "updated_at": "2025-02-05T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

#### GET /api/projects/[id]
**Purpose:** Get single project with all data
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC Restoration Sitemap",
    "client_url": "https://abcrestoration.com",
    "template_id": "uuid",
    "services_config": [...],
    "locations": [...],
    "crawl_data": {...},
    "comparison_result": {...},
    "status": "compared",
    "created_at": "2025-02-05T12:00:00.000Z"
  }
}
```

#### POST /api/projects
**Purpose:** Create new project
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Request Body:**
```json
{
  "name": "string - Project name (required)",
  "client_url": "string - Client website URL (optional)",
  "template_id": "uuid - Selected template (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Project",
    "status": "draft",
    ...
  }
}
```

#### PUT /api/projects/[id]
**Purpose:** Update project
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Request Body:**
```json
{
  "name": "string (optional)",
  "client_url": "string (optional)",
  "template_id": "uuid (optional)",
  "services_config": "array (optional)",
  "locations": "array (optional)",
  "status": "string (optional)"
}
```

#### DELETE /api/projects/[id]
**Purpose:** Delete project and all sitemap nodes
**Auth Required:** Yes
**Roles Allowed:** Owner only

---

### Crawling

#### POST /api/crawl
**Purpose:** Crawl client website sitemap
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Request Body:**
```json
{
  "project_id": "uuid - Project to associate crawl with",
  "url": "string - Website URL to crawl"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pages_found": 45,
    "pages": [
      {
        "url": "https://example.com/",
        "title": "Home",
        "last_modified": "2025-01-15T00:00:00.000Z"
      },
      {
        "url": "https://example.com/water-damage",
        "title": "Water Damage Restoration",
        "last_modified": "2025-01-10T00:00:00.000Z"
      }
    ],
    "sitemap_url": "https://example.com/sitemap.xml",
    "crawled_at": "2025-02-05T12:00:00.000Z"
  }
}
```

**Errors:**
| Code | Error Key | When | Resolution |
|------|-----------|------|------------|
| 400 | CRAWL_INVALID_URL | Invalid URL format | Provide valid URL |
| 408 | CRAWL_TIMEOUT | Crawl took too long | Try again or check site |
| 422 | CRAWL_NO_SITEMAP | No sitemap found | Manual entry required |
| 502 | CRAWL_SITE_ERROR | Site returned error | Check if site is accessible |

---

### AI Comparison

#### POST /api/ai/compare
**Purpose:** Compare client pages with template using AI
**Auth Required:** Yes
**Roles Allowed:** Any authenticated

**Request Body:**
```json
{
  "project_id": "uuid - Project ID",
  "template_pages": ["Home", "Water Damage", "Fire Damage"],
  "client_pages": [
    { "title": "Home Page", "url": "https://example.com/" },
    { "title": "Water Damage Restoration Services", "url": "https://example.com/water-damage" },
    { "title": "Financing Options", "url": "https://example.com/financing" }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "template_page": "Home",
        "client_page": { "title": "Home Page", "url": "..." },
        "confidence": 0.95
      },
      {
        "template_page": "Water Damage",
        "client_page": { "title": "Water Damage Restoration Services", "url": "..." },
        "confidence": 0.92
      }
    ],
    "template_only": ["Fire Damage"],
    "client_only": [
      { "title": "Financing Options", "url": "...", "suggested_category": "standard" }
    ],
    "uncertain": [],
    "tokens_used": 1250
  }
}
```

**Errors:**
| Code | Error Key | When | Resolution |
|------|-----------|------|------------|
| 429 | AI_RATE_LIMITED | Too many requests | Wait and retry |
| 500 | AI_API_ERROR | Claude API error | Retry or check API status |
| 503 | AI_UNAVAILABLE | Claude API down | Retry later |

---

### Sitemap Nodes

#### GET /api/projects/[id]/nodes
**Purpose:** Get all sitemap nodes for a project
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Home",
      "url": "/",
      "page_type": "standard",
      "parent_id": null,
      "source": "template",
      "client_original_url": null,
      "position": 0
    },
    {
      "id": "uuid",
      "title": "Water Damage",
      "url": "/water-damage",
      "page_type": "service",
      "parent_id": "services-uuid",
      "source": "template",
      "position": 0
    }
  ]
}
```

#### POST /api/projects/[id]/nodes
**Purpose:** Create sitemap node
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Request Body:**
```json
{
  "title": "string",
  "url": "string (optional)",
  "page_type": "standard | service | location | service_location",
  "parent_id": "uuid (optional)",
  "source": "template | client",
  "client_original_url": "string (optional)",
  "position": "number (optional)"
}
```

#### POST /api/projects/[id]/nodes/bulk
**Purpose:** Create multiple nodes at once (for matrix generation)
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Request Body:**
```json
{
  "nodes": [
    { "title": "Miami", "page_type": "location", ... },
    { "title": "Miami Water Damage", "page_type": "service_location", ... }
  ]
}
```

#### PUT /api/projects/[id]/nodes/[nodeId]
**Purpose:** Update sitemap node
**Auth Required:** Yes
**Roles Allowed:** Owner only

#### DELETE /api/projects/[id]/nodes/[nodeId]
**Purpose:** Delete sitemap node
**Auth Required:** Yes
**Roles Allowed:** Owner only

---

### Export

#### GET /api/projects/[id]/export/csv
**Purpose:** Export sitemap as CSV
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Response:** CSV file download with headers:
```
Title,URL,Page Type,Source,Original URL,Parent,Depth
Home,/,standard,template,,Root,0
Services,/services,standard,template,,Root,0
Water Damage,/water-damage,service,template,,Services,1
```

#### GET /api/projects/[id]/export/json
**Purpose:** Export sitemap as JSON (for programmatic use)
**Auth Required:** Yes
**Roles Allowed:** Owner only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project_name": "ABC Restoration Sitemap",
    "exported_at": "2025-02-05T12:00:00.000Z",
    "nodes": [
      {
        "title": "Home",
        "url": "/",
        "type": "standard",
        "source": "template",
        "children": [...]
      }
    ]
  }
}
```

---

## HTTP Status Code Usage

| Status | When to Use | Example Errors |
|--------|-------------|----------------|
| 200 | Success (GET, PUT) | Successful retrieval/update |
| 201 | Created (POST) | New resource created |
| 400 | Bad request / validation | VAL_* errors |
| 401 | Not authenticated | AUTH_REQUIRED |
| 403 | Authenticated but forbidden | AUTH_FORBIDDEN |
| 404 | Resource not found | RES_NOT_FOUND |
| 408 | Timeout | CRAWL_TIMEOUT |
| 422 | Unprocessable | Business rule violations |
| 429 | Rate limited | AI_RATE_LIMITED |
| 500 | Server error | SYS_* errors |
| 502 | Bad gateway | External service error |
| 503 | Service unavailable | AI_UNAVAILABLE |

---
⚠️ **AI INSTRUCTION:** When you add/modify an endpoint, UPDATE THIS FILE IMMEDIATELY.
