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
1. **Matches**: Client pages that clearly correspond to template pages
2. **Template Only**: Template pages that the client doesn't have
3. **Client Only**: Client pages that don't match any template page
4. **Uncertain**: Potential matches that need clarification

**Rules:**
- Be smart about semantic matching (e.g., "Water Damage Services" matches "Water Damage Restoration")
- Ignore differences in capitalization and minor wording variations
- Consider BOTH titles AND URL patterns for matching (e.g., template "/water-damage" likely matches client "/water-damage-services")
- URL structure similarity is a strong signal (e.g., both having /services/plumbing or similar paths)
- Assign confidence scores (0.0-1.0) to each match based on both title AND URL similarity
- Only include matches with confidence >= 0.6 in the "matches" array
- Put lower-confidence potential matches (0.4-0.59) in "uncertain"

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
  "template_only": ["Fire Damage Restoration", "Mold Remediation"],
  "client_only": [
    {
      "title": "Financing Options",
      "url": "https://example.com/financing",
      "suggested_category": "standard"
    }
  ],
  "uncertain": [
    {
      "template_page": "Storm Damage",
      "client_page": {
        "title": "Emergency Services",
        "url": "https://example.com/emergency"
      },
      "confidence": 0.5,
      "reason": "Could be related but not clearly the same service"
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
