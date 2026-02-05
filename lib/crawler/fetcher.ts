/**
 * HTTP fetcher utility for crawling websites
 */

export interface FetchResult {
  content: string
  url: string
  statusCode: number
  headers: Record<string, string>
}

export interface FetchOptions {
  timeout?: number
  maxRedirects?: number
  userAgent?: string
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeout: 10000, // 10 seconds
  maxRedirects: 5,
  userAgent: 'AI-Sitemap-Builder/1.0'
}

/**
 * Fetch a URL with timeout and error handling
 */
export async function fetchUrl(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': opts.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const content = await response.text()
    
    // Extract headers as simple object
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return {
      content,
      url: response.url, // Final URL after redirects
      statusCode: response.status,
      headers
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${opts.timeout}ms`)
      }
      throw new Error(`Failed to fetch ${url}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' }
    }
    
    if (!parsed.hostname) {
      return { valid: false, error: 'Invalid hostname' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Normalize URL to ensure consistent format
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove trailing slash from pathname (except root)
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.toString()
  } catch {
    return url
  }
}
