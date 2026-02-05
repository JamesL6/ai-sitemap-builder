/**
 * Page comparison logic using Claude AI
 */

import { askClaude } from './client'
import { buildComparisonPrompt, parseComparisonResponse, type ParsedComparison, type ComparisonPromptData } from './prompts'

export interface ComparisonResult extends ParsedComparison {
  tokensUsed?: number
}

/**
 * Compare template pages with client pages using Claude AI
 */
export async function comparePages(
  templatePages: Array<{ title: string; url_pattern: string }>,
  clientPages: Array<{ title: string; url: string }>
): Promise<ComparisonResult> {
  // Build prompt
  const promptData: ComparisonPromptData = {
    templatePages,
    clientPages
  }
  const prompt = buildComparisonPrompt(promptData)

  try {
    // Ask Claude with extended thinking for complex page matching
    const response = await askClaude(prompt, {
      // temperature: 1, // Temperature is automatically set to 1 by the client when thinking is enabled
      maxTokens: 64000, // Maximum output tokens for comprehensive analysis
      thinking: {
        type: 'enabled',
        budget_tokens: 32000 // Large thinking budget for deep reasoning on complex sitemaps
      }
    })

    // Parse response
    const parsed = parseComparisonResponse(response)

    // Programmatically compute client-only pages instead of relying on AI to list them all.
    // With large sitemaps (hundreds of pages), AI truncates the client_only list.
    // We take the full client list and subtract any URLs that appear in matches or uncertain.
    const matchedClientUrls = new Set<string>()
    
    for (const match of parsed.matches) {
      matchedClientUrls.add(normalizeUrl(match.client_page.url))
    }
    for (const uncertain of parsed.uncertain) {
      matchedClientUrls.add(normalizeUrl(uncertain.client_page.url))
    }

    const computedClientOnly = clientPages
      .filter(page => !matchedClientUrls.has(normalizeUrl(page.url)))
      .map(page => ({
        title: page.title,
        url: page.url,
        suggested_category: guessPageCategory(page.url, page.title)
      }))

    return {
      ...parsed,
      clientOnly: computedClientOnly,
      tokensUsed: estimateTokens(prompt, response)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to compare pages with AI')
  }
}

/**
 * Normalize a URL for comparison (lowercase, remove trailing slashes, remove protocol)
 */
function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

/**
 * Guess a page category based on URL path and title
 */
function guessPageCategory(url: string, title: string): string {
  const path = url.toLowerCase()
  const t = title.toLowerCase()

  // Location pages (contain city/state names or location patterns)
  if (path.match(/\/[a-z]+-[a-z]{2}\/?$/) || // e.g., /nashville-tn/
      path.includes('/service-area') ||
      path.includes('/location')) {
    return 'location'
  }

  // Service pages (nested under a service category)
  if (path.includes('/water-damage/') ||
      path.includes('/fire-damage/') ||
      path.includes('/mold') ||
      path.includes('/storm-damage/') ||
      path.includes('/biohazard/') ||
      path.includes('/restoration/') ||
      path.includes('/services/')) {
    return 'service'
  }

  // Blog / content
  if (path.includes('/blog') || path.includes('/news') || path.includes('/article')) {
    return 'blog'
  }

  // Common standard pages
  if (t.includes('privacy') || t.includes('terms') || t.includes('sitemap') ||
      t.includes('career') || t.includes('employment') || t.includes('review') ||
      t.includes('gallery') || t.includes('faq') || t.includes('about') ||
      t.includes('contact')) {
    return 'standard'
  }

  return 'standard'
}

/**
 * Estimate token usage (rough approximation)
 */
function estimateTokens(prompt: string, response: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  const promptTokens = Math.ceil(prompt.length / 4)
  const responseTokens = Math.ceil(response.length / 4)
  return promptTokens + responseTokens
}

/**
 * Extract template pages from template structure (all pages at all depths)
 * @deprecated Use extractAllPages from template-helpers instead
 */
export function extractTemplatePages(templateStructure: { pages: any[] }): string[] {
  const pages: string[] = []

  function traverse(pageArray: any[]) {
    for (const page of pageArray) {
      if (page.title) {
        pages.push(page.title)
      }
      if (page.children && Array.isArray(page.children)) {
        traverse(page.children)
      }
    }
  }

  traverse(templateStructure.pages || [])
  return pages
}
