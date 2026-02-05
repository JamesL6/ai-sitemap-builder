/**
 * Main sitemap crawler
 */

import { fetchUrl, validateUrl, normalizeUrl } from './fetcher'
import { parseSitemap, extractTitleFromUrl, type SitemapUrl } from './parser'

export interface CrawledPage {
  url: string
  title: string
  lastModified?: string
}

export interface CrawlResult {
  success: boolean
  pages: CrawledPage[]
  sitemapUrl: string
  pagesFound: number
  error?: string
}

/**
 * Attempt to find sitemap.xml at common locations
 */
async function findSitemap(baseUrl: string): Promise<string | null> {
  const commonPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
  ]

  for (const path of commonPaths) {
    try {
      const url = new URL(path, baseUrl).toString()
      await fetchUrl(url, { timeout: 5000 })
      return url
    } catch {
      // Try next path
      continue
    }
  }

  // Try robots.txt to find sitemap
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString()
    const result = await fetchUrl(robotsUrl, { timeout: 5000 })
    
    // Look for Sitemap: directive
    const match = /^Sitemap:\s*(.+)$/im.exec(result.content)
    if (match && match[1]) {
      const sitemapUrl = match[1].trim()
      // Verify it exists
      await fetchUrl(sitemapUrl, { timeout: 5000 })
      return sitemapUrl
    }
  } catch {
    // robots.txt not found or no sitemap
  }

  return null
}

/**
 * Crawl a website's sitemap
 */
export async function crawlSitemap(url: string): Promise<CrawlResult> {
  // Validate URL
  const validation = validateUrl(url)
  if (!validation.valid) {
    return {
      success: false,
      pages: [],
      sitemapUrl: '',
      pagesFound: 0,
      error: validation.error || 'Invalid URL'
    }
  }

  try {
    const normalizedUrl = normalizeUrl(url)
    const baseUrl = new URL(normalizedUrl).origin

    // Find sitemap
    const sitemapUrl = await findSitemap(baseUrl)
    if (!sitemapUrl) {
      return {
        success: false,
        pages: [],
        sitemapUrl: '',
        pagesFound: 0,
        error: 'No sitemap.xml found. Tried common locations and robots.txt.'
      }
    }

    // Fetch and parse sitemap
    const sitemapContent = await fetchUrl(sitemapUrl)
    const parsed = parseSitemap(sitemapContent.content)

    // If it's a sitemap index, fetch the first actual sitemap
    if (parsed.isSitemapIndex && parsed.sitemapUrls && parsed.sitemapUrls.length > 0) {
      const firstSitemap = parsed.sitemapUrls[0]
      const subSitemapContent = await fetchUrl(firstSitemap)
      const subParsed = parseSitemap(subSitemapContent.content)
      
      return processUrls(subParsed.urls, sitemapUrl)
    }

    return processUrls(parsed.urls, sitemapUrl)
  } catch (error) {
    return {
      success: false,
      pages: [],
      sitemapUrl: '',
      pagesFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Process URLs into crawled pages
 */
function processUrls(urls: SitemapUrl[], sitemapUrl: string): CrawlResult {
  const pages: CrawledPage[] = urls.map(url => ({
    url: url.loc,
    title: extractTitleFromUrl(url.loc),
    lastModified: url.lastmod
  }))

  return {
    success: true,
    pages,
    sitemapUrl,
    pagesFound: pages.length
  }
}

/**
 * Validate if a URL looks like it could have a sitemap
 */
export function canCrawl(url: string): boolean {
  const validation = validateUrl(url)
  return validation.valid
}
