/**
 * XML sitemap parser
 */

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export interface ParseResult {
  urls: SitemapUrl[]
  isSitemapIndex: boolean
  sitemapUrls?: string[]
}

/**
 * Parse XML sitemap content
 */
export function parseSitemap(xml: string): ParseResult {
  try {
    // Check if it's a sitemap index
    const isSitemapIndex = xml.includes('<sitemapindex')

    if (isSitemapIndex) {
      return parseSitemapIndex(xml)
    } else {
      return parseUrlSet(xml)
    }
  } catch (error) {
    throw new Error(`Failed to parse sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse sitemap index (contains links to other sitemaps)
 */
function parseSitemapIndex(xml: string): ParseResult {
  const sitemapUrls: string[] = []
  
  // Extract <loc> tags from <sitemap> entries
  const sitemapRegex = /<sitemap[^>]*>([\s\S]*?)<\/sitemap>/gi
  let match

  while ((match = sitemapRegex.exec(xml)) !== null) {
    const sitemapContent = match[1]
    const locMatch = /<loc[^>]*>(.*?)<\/loc>/i.exec(sitemapContent)
    if (locMatch && locMatch[1]) {
      sitemapUrls.push(locMatch[1].trim())
    }
  }

  return {
    urls: [],
    isSitemapIndex: true,
    sitemapUrls
  }
}

/**
 * Parse URL set (actual sitemap with URLs)
 */
function parseUrlSet(xml: string): ParseResult {
  const urls: SitemapUrl[] = []
  
  // Extract <url> entries
  const urlRegex = /<url[^>]*>([\s\S]*?)<\/url>/gi
  let match

  while ((match = urlRegex.exec(xml)) !== null) {
    const urlContent = match[1]
    const url = parseUrlEntry(urlContent)
    if (url) {
      urls.push(url)
    }
  }

  return {
    urls,
    isSitemapIndex: false
  }
}

/**
 * Parse individual URL entry
 */
function parseUrlEntry(content: string): SitemapUrl | null {
  const locMatch = /<loc[^>]*>(.*?)<\/loc>/i.exec(content)
  if (!locMatch || !locMatch[1]) {
    return null
  }

  const url: SitemapUrl = {
    loc: locMatch[1].trim()
  }

  // Optional: extract lastmod
  const lastmodMatch = /<lastmod[^>]*>(.*?)<\/lastmod>/i.exec(content)
  if (lastmodMatch && lastmodMatch[1]) {
    url.lastmod = lastmodMatch[1].trim()
  }

  // Optional: extract changefreq
  const changefreqMatch = /<changefreq[^>]*>(.*?)<\/changefreq>/i.exec(content)
  if (changefreqMatch && changefreqMatch[1]) {
    url.changefreq = changefreqMatch[1].trim()
  }

  // Optional: extract priority
  const priorityMatch = /<priority[^>]*>(.*?)<\/priority>/i.exec(content)
  if (priorityMatch && priorityMatch[1]) {
    url.priority = priorityMatch[1].trim()
  }

  return url
}

/**
 * Extract title from URL path (fallback when crawling)
 */
export function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    
    // Remove leading/trailing slashes
    const cleanPath = path.replace(/^\/|\/$/g, '')
    
    // If root, return "Home"
    if (!cleanPath) return 'Home'
    
    // Get last segment
    const segments = cleanPath.split('/')
    const lastSegment = segments[segments.length - 1]
    
    // Remove file extensions
    const withoutExt = lastSegment.replace(/\.(html|htm|php|asp|aspx)$/i, '')
    
    // Convert hyphens/underscores to spaces and title case
    return withoutExt
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  } catch {
    return 'Unknown Page'
  }
}
