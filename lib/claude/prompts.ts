/**
 * Prompt templates for Claude AI interactions
 */

export interface PageMatch {
  template_page: string
  client_page: {
    title: string
    url: string
  }
  confidence: number
}

export interface ComparisonPromptData {
  templatePages: Array<{ title: string; url_pattern: string }>
  clientPages: Array<{ title: string; url: string }>
}

/**
 * Generate prompt for comparing template pages with client pages
 */
export function buildComparisonPrompt(data: ComparisonPromptData): string {
  return `You are analyzing a website's sitemap to match pages with a template structure.

**Template Pages (Expected):**
${data.templatePages.map((page, i) => `${i + 1}. ${page.title} - ${page.url_pattern}`).join('\n')}

**Client Pages (From their website):**
${data.clientPages.map((page, i) => `${i + 1}. ${page.title} - ${page.url}`).join('\n')}

**Task:**
Compare the template pages with the client's actual pages and identify:
1. **Matches**: Client pages that clearly correspond to template pages (best 1:1 match)
2. **Template Only**: Template pages that the client doesn't have AT ALL (no match, no partial overlap)
3. **Uncertain**: Potential matches OR partial overlaps that need human review

IMPORTANT: You do NOT need to list client-only pages. Those will be computed automatically by subtracting matched/uncertain pages from the full client list. Focus your effort on finding matches AND partial overlaps.

**Rules for Matching:**
- Be smart about semantic matching (e.g., "Water Damage Services" matches "Water Damage Restoration")
- Ignore differences in capitalization and minor wording variations
- Consider BOTH titles AND URL patterns for matching (e.g., template "/water-damage" likely matches client "/water-damage-services")
- URL structure similarity is a strong signal (e.g., both having /services/plumbing or similar paths)
- Assign confidence scores (0.0-1.0) to each match based on both title AND URL similarity
- Only include matches with confidence >= 0.6 in the "matches" array

**Rules for Uncertain (CRITICAL - catch partial overlaps):**
A template page CAN appear in BOTH "matches" AND "uncertain". This is important for catching:

1. **Content splitting**: The template has ONE page covering multiple topics, but the client splits it into separate pages.
   Example: Template "Mold Inspection & Testing" matches client "Mold Inspection" at 90%. But client ALSO has a separate "Mold Testing" page — that should be uncertain with reason "Client has a separate page for testing, which is part of the template's combined Inspection & Testing page"

2. **Related sub-services**: A client page covers a subset or related aspect of a template page's service.
   Example: Template "Water Damage Restoration" matches client "Water Damage". But client also has "Emergency Cleanup" under /water-damage/ — flag as uncertain.

3. **URL-path siblings**: If a client page sits under the same URL directory as a matched page but wasn't matched, consider whether it's a sub-topic of the template page.
   Example: Template "Storm Damage Restoration" matches client "Storm Damage". Client also has "Post Storm Temporary Repairs" at /storm-damage/post-storm-temporary-repairs/ — flag as uncertain.

4. **Keyword overlap**: If a client page's title contains key terms from a template page title (or vice versa), flag as uncertain even if another client page was the primary match.

- Put uncertain matches at any confidence level (0.1-0.99) with a clear "reason" explaining the relationship
- Each CLIENT page should appear at most ONCE across matches and uncertain
- Each TEMPLATE page CAN appear multiple times: once in matches (best match) AND additionally in uncertain (partial overlaps with other client pages)
- Only put a template page in "template_only" if there are NO client pages that match or partially overlap

**Response Format (JSON only, no markdown):**
{
  "matches": [
    {
      "template_page": "Water Damage Restoration",
      "client_page": {
        "title": "Water Damage Services",
        "url": "https://example.com/water-damage"
      },
      "confidence": 0.95
    }
  ],
  "template_only": ["Biohazard"],
  "uncertain": [
    {
      "template_page": "Mold Inspection & Testing",
      "client_page": {
        "title": "Mold Testing",
        "url": "https://example.com/mold/mold-testing"
      },
      "confidence": 0.7,
      "reason": "Client has a separate page for mold testing; template combines inspection and testing into one page"
    },
    {
      "template_page": "Storm Damage Restoration",
      "client_page": {
        "title": "Post Storm Temporary Repairs",
        "url": "https://example.com/storm-damage/post-storm-temporary-repairs"
      },
      "confidence": 0.5,
      "reason": "Sub-service under storm damage; client page sits under same URL path as the matched storm damage page"
    }
  ]
}

Return ONLY the JSON object, no other text.`
}

/**
 * Parse Claude's comparison response
 */
export interface ParsedComparison {
  matches: PageMatch[]
  templateOnly: string[]
  clientOnly: Array<{
    title: string
    url: string
    suggested_category?: string
  }>
  uncertain: Array<{
    template_page: string
    client_page: {
      title: string
      url: string
    }
    confidence: number
    reason?: string
  }>
}

export function parseComparisonResponse(response: string): ParsedComparison {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const parsed = JSON.parse(cleaned)

    return {
      matches: parsed.matches || [],
      templateOnly: parsed.template_only || [],
      clientOnly: parsed.client_only || [],
      uncertain: parsed.uncertain || []
    }
  } catch (error) {
    throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
  }
}
