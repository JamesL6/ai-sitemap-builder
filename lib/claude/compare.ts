/**
 * Page comparison logic using Claude AI
 */

import { askClaude } from './client'
import { buildComparisonPrompt, parseComparisonResponse, type ParsedComparison, type ComparisonPromptData } from './prompts'

export interface ComparisonResult extends ParsedComparison {
  tokensUsed?: number
}

interface LocationInfo {
  id: string
  name: string
  url_slug: string
}

/**
 * Compare template pages with client pages using Claude AI.
 * If locations are provided, also does programmatic location-page matching.
 */
export async function comparePages(
  templatePages: Array<{ title: string; url_pattern: string }>,
  clientPages: Array<{ title: string; url: string }>,
  locations?: LocationInfo[]
): Promise<ComparisonResult> {
  // Build prompt — only sends base template pages (not location-expanded)
  const promptData: ComparisonPromptData = {
    templatePages,
    clientPages
  }
  const prompt = buildComparisonPrompt(promptData)

  try {
    // Ask Claude — reduced thinking budget for faster response
    const response = await askClaude(prompt, {
      maxTokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000
      }
    })

    // Parse response
    const parsed = parseComparisonResponse(response)

    // Collect all client URLs that were matched or uncertain by AI
    const matchedClientUrls = new Set<string>()
    for (const match of parsed.matches) {
      matchedClientUrls.add(normalizeUrl(match.client_page.url))
    }
    for (const uncertain of parsed.uncertain) {
      matchedClientUrls.add(normalizeUrl(uncertain.client_page.url))
    }

    // If locations provided, do programmatic location-page matching
    if (locations && locations.length > 0) {
      const locationMatches = matchLocationPages(clientPages, locations, templatePages, matchedClientUrls)
      
      // Add location matches to the results
      parsed.matches.push(...locationMatches.matches)
      parsed.uncertain.push(...locationMatches.uncertain)
      
      // Update matched URLs set
      for (const m of locationMatches.matches) {
        matchedClientUrls.add(normalizeUrl(m.client_page.url))
      }
      for (const u of locationMatches.uncertain) {
        matchedClientUrls.add(normalizeUrl(u.client_page.url))
      }
    }

    // Compute client-only pages by subtracting all matched/uncertain URLs
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
 * Programmatically match client pages to location-specific template pages.
 * Looks for URL patterns like /{location-slug}/, /{location-slug}-{service}/,
 * or title patterns like "{Location Name} {Service}".
 */
function matchLocationPages(
  clientPages: Array<{ title: string; url: string }>,
  locations: LocationInfo[],
  templatePages: Array<{ title: string; url_pattern: string }>,
  alreadyMatched: Set<string>
): {
  matches: ParsedComparison['matches']
  uncertain: ParsedComparison['uncertain']
} {
  const matches: ParsedComparison['matches'] = []
  const uncertain: ParsedComparison['uncertain'] = []

  // Build lookup helpers
  const locationSlugs = locations.map(l => l.url_slug.toLowerCase())
  const locationNames = locations.map(l => l.name.toLowerCase())
  const templateTitles = templatePages.map(t => t.title.toLowerCase())

  for (const clientPage of clientPages) {
    if (alreadyMatched.has(normalizeUrl(clientPage.url))) continue

    const clientUrl = clientPage.url.toLowerCase()
    const clientTitle = clientPage.title.toLowerCase()

    // Check if this client page contains a location slug in its URL
    let matchedLocation: LocationInfo | null = null
    for (let i = 0; i < locations.length; i++) {
      const slug = locationSlugs[i]
      if (clientUrl.includes(`/${slug}/`) || clientUrl.includes(`/${slug}-`) || clientUrl.endsWith(`/${slug}`)) {
        matchedLocation = locations[i]
        break
      }
    }

    // Also check title for location name
    if (!matchedLocation) {
      for (let i = 0; i < locations.length; i++) {
        if (clientTitle.includes(locationNames[i])) {
          matchedLocation = locations[i]
          break
        }
      }
    }

    if (!matchedLocation) continue

    // This client page is location-related. Try to match it to a template page.
    const locationName = matchedLocation.name
    const locationSlug = matchedLocation.url_slug

    // Check if it's a location landing page (URL is just the location slug)
    const pathAfterDomain = clientUrl.replace(/^https?:\/\/[^/]+/, '')
    const isLandingPage = pathAfterDomain.replace(/\/$/, '') === `/${locationSlug}` ||
                          pathAfterDomain.replace(/\/$/, '') === `/service-areas/${locationSlug}`

    if (isLandingPage) {
      matches.push({
        template_page: `${locationName} (Location Landing Page)`,
        client_page: { title: clientPage.title, url: clientPage.url },
        confidence: 0.9
      })
      continue
    }

    // Try to match against template service pages 
    // e.g., client "/nashville-tn/water-damage/" → template "Water Damage Restoration"
    let bestMatch: { templateTitle: string; confidence: number } | null = null

    for (const tp of templatePages) {
      const tTitle = tp.title.toLowerCase()
      const tSlug = tp.url_pattern.toLowerCase().replace(/^\//, '').replace(/\//g, '-')

      // Check URL contains template slug
      if (clientUrl.includes(tSlug) || clientUrl.includes(tSlug.replace(/-/g, '/'))) {
        const conf = 0.85
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { templateTitle: `${locationName} ${tp.title}`, confidence: conf }
        }
      }

      // Check title contains template title keywords
      const titleWithoutLocation = clientTitle.replace(locationName.toLowerCase(), '').trim()
      if (titleWithoutLocation && (
        tTitle.includes(titleWithoutLocation) || titleWithoutLocation.includes(tTitle)
      )) {
        const conf = 0.8
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { templateTitle: `${locationName} ${tp.title}`, confidence: conf }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.7) {
      matches.push({
        template_page: bestMatch.templateTitle,
        client_page: { title: clientPage.title, url: clientPage.url },
        confidence: bestMatch.confidence
      })
    } else if (bestMatch) {
      uncertain.push({
        template_page: bestMatch.templateTitle,
        client_page: { title: clientPage.title, url: clientPage.url },
        confidence: bestMatch.confidence,
        reason: `Location page for ${locationName} - possible match based on URL/title similarity`
      })
    } else {
      // It's a location page but doesn't match any template service
      uncertain.push({
        template_page: `${locationName} (Unknown Service)`,
        client_page: { title: clientPage.title, url: clientPage.url },
        confidence: 0.4,
        reason: `Found under ${locationName} location path but doesn't match a known template service`
      })
    }
  }

  return { matches, uncertain }
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
