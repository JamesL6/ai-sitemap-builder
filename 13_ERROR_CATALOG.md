# Error Catalog

## Error Code Format
Pattern: `[PREFIX]_[CATEGORY]_[SPECIFIC]` or `[PREFIX]_[SPECIFIC]`

Examples:
- `AUTH_REQUIRED` - Authentication required
- `VAL_EMAIL_INVALID` - Validation: invalid email
- `CRAWL_TIMEOUT` - Crawler timeout

## Error Categories

### Authentication Errors (AUTH_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| AUTH_REQUIRED | 401 | "Please log in to continue" | No valid session/token | Redirect to login |
| AUTH_INVALID_CREDENTIALS | 401 | "Invalid email or password" | Wrong credentials | Check and retry |
| AUTH_SESSION_EXPIRED | 401 | "Your session has expired. Please log in again" | Token expired | Refresh or re-login |
| AUTH_FORBIDDEN | 403 | "You don't have permission to perform this action" | Insufficient role/permissions | Contact admin |
| AUTH_EMAIL_EXISTS | 409 | "An account with this email already exists" | Duplicate registration | Login instead |
| AUTH_WEAK_PASSWORD | 400 | "Password must be at least 8 characters" | Password too short | Use stronger password |

### Validation Errors (VAL_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| VAL_REQUIRED_FIELD | 400 | "[Field] is required" | Missing required field | Provide the field |
| VAL_EMAIL_INVALID | 400 | "Please enter a valid email address" | Invalid email format | Fix email format |
| VAL_URL_INVALID | 400 | "Please enter a valid URL" | Malformed URL | Fix URL format |
| VAL_NAME_TOO_LONG | 400 | "Name must be 255 characters or less" | Exceeds max length | Shorten name |
| VAL_SLUG_INVALID | 400 | "URL slug can only contain lowercase letters, numbers, and hyphens" | Invalid characters | Fix slug format |
| VAL_JSON_INVALID | 400 | "Invalid data format" | Malformed JSON | Fix data structure |

### Resource Errors (RES_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| RES_NOT_FOUND | 404 | "[Resource] not found" | Resource doesn't exist | Check ID/URL |
| RES_ALREADY_EXISTS | 409 | "[Resource] already exists" | Duplicate creation | Use existing or rename |
| RES_DELETED | 410 | "This [resource] has been deleted" | Resource was deleted | Create new |
| RES_ACCESS_DENIED | 403 | "You don't have access to this [resource]" | Not owner/authorized | Check permissions |

### Crawler Errors (CRAWL_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| CRAWL_INVALID_URL | 400 | "Please enter a valid website URL" | Malformed URL | Fix URL format |
| CRAWL_TIMEOUT | 408 | "The website took too long to respond. Please try again" | Request timeout (>30s) | Retry or check if site is up |
| CRAWL_NO_SITEMAP | 422 | "No sitemap found at this website. You can enter pages manually" | sitemap.xml not found | Manual entry |
| CRAWL_SITE_ERROR | 502 | "Could not reach the website. Please check the URL" | Site returned error | Verify URL is correct |
| CRAWL_BLOCKED | 403 | "The website blocked our request" | robots.txt or firewall | Try different approach |
| CRAWL_PARSE_ERROR | 422 | "Could not read the sitemap format" | Invalid sitemap XML | Manual entry |
| CRAWL_TOO_LARGE | 413 | "The sitemap is too large to process" | >200 pages | Partial crawl |

### AI/Claude Errors (AI_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| AI_API_ERROR | 500 | "AI service error. Please try again" | Claude API error | Retry |
| AI_RATE_LIMITED | 429 | "Too many requests. Please wait a moment and try again" | Rate limit exceeded | Wait 60s and retry |
| AI_UNAVAILABLE | 503 | "AI service is temporarily unavailable" | Claude API down | Try later |
| AI_INVALID_RESPONSE | 500 | "AI returned an unexpected response" | Parsing failed | Retry |
| AI_BUDGET_EXCEEDED | 429 | "Monthly AI budget has been reached. Contact administrator" | $50 limit hit | Wait for reset or increase limit |

### Export Errors (EXPORT_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| EXPORT_NO_DATA | 400 | "No sitemap data to export" | Empty project | Generate sitemap first |
| EXPORT_FAILED | 500 | "Export failed. Please try again" | Generation error | Retry |

### System Errors (SYS_)

| Code | HTTP | User Message | Internal Cause | Resolution |
|------|------|--------------|----------------|------------|
| SYS_INTERNAL | 500 | "Something went wrong. Please try again" | Unhandled exception | Retry; if persists, contact support |
| SYS_DATABASE | 500 | "Database error. Please try again" | Supabase error | Retry |
| SYS_CONFIG | 500 | "Server configuration error" | Missing env var | Check deployment |
| SYS_RATE_LIMITED | 429 | "Too many requests. Please slow down" | Global rate limit | Wait and retry |

## HTTP Status Code Usage

| Status | When to Use | Example Errors |
|--------|-------------|----------------|
| 400 | Bad request / validation failed | VAL_* errors |
| 401 | Not authenticated | AUTH_REQUIRED, AUTH_INVALID_CREDENTIALS |
| 403 | Authenticated but forbidden | AUTH_FORBIDDEN, RES_ACCESS_DENIED |
| 404 | Resource not found | RES_NOT_FOUND |
| 408 | Request timeout | CRAWL_TIMEOUT |
| 409 | Conflict / duplicate | AUTH_EMAIL_EXISTS, RES_ALREADY_EXISTS |
| 410 | Resource gone | RES_DELETED |
| 413 | Payload too large | CRAWL_TOO_LARGE |
| 422 | Unprocessable entity | CRAWL_NO_SITEMAP, CRAWL_PARSE_ERROR |
| 429 | Rate limited | AI_RATE_LIMITED, SYS_RATE_LIMITED |
| 500 | Internal server error | SYS_*, AI_API_ERROR |
| 502 | Bad gateway | CRAWL_SITE_ERROR |
| 503 | Service unavailable | AI_UNAVAILABLE |

## Logging Requirements

| Severity | Error Types | Log Level | Alert | Retention |
|----------|-------------|-----------|-------|-----------|
| Critical | SYS_INTERNAL, SYS_DATABASE | ERROR | Immediate | 90 days |
| High | AI_API_ERROR, AUTH failures | ERROR | Daily digest | 60 days |
| Medium | CRAWL errors, VAL errors | WARN | Weekly summary | 30 days |
| Low | Rate limits, not found | INFO | None | 7 days |

## Error Response Template

### Standard Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Please log in to continue"
  }
}
```

### Validation Error Response (with details)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VAL_REQUIRED_FIELD",
    "message": "Validation failed",
    "details": {
      "name": "Name is required",
      "client_url": "Please enter a valid URL"
    }
  }
}
```

## Error Handling Implementation

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, string>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Common errors factory
export const Errors = {
  authRequired: () => new AppError('AUTH_REQUIRED', 'Please log in to continue', 401),
  forbidden: () => new AppError('AUTH_FORBIDDEN', "You don't have permission", 403),
  notFound: (resource: string) => new AppError('RES_NOT_FOUND', `${resource} not found`, 404),
  validation: (details: Record<string, string>) => 
    new AppError('VAL_REQUIRED_FIELD', 'Validation failed', 400, details),
  crawlTimeout: () => new AppError('CRAWL_TIMEOUT', 'Website took too long to respond', 408),
  aiRateLimited: () => new AppError('AI_RATE_LIMITED', 'Too many requests', 429),
}
```

## User-Facing Error Messages

### Tone Guidelines
- Be helpful, not technical
- Suggest a resolution when possible
- Don't blame the user
- Don't expose internal details

### Examples

❌ **Bad:** "Error: ECONNREFUSED 127.0.0.1:5432"
✅ **Good:** "Database error. Please try again"

❌ **Bad:** "Null pointer exception in CrawlerService.parseXml()"
✅ **Good:** "Could not read the sitemap format"

❌ **Bad:** "You submitted invalid data"
✅ **Good:** "Please enter a valid email address"
