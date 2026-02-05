'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrawlResults } from './CrawlResults'
import { Loader2 } from 'lucide-react'

interface CrawledPage {
  url: string
  title: string
  lastModified?: string
}

interface CrawlFormProps {
  projectId: string
  initialUrl?: string
  onSuccess?: (pages: CrawledPage[]) => void
}

export function CrawlForm({ projectId, initialUrl = '', onSuccess }: CrawlFormProps) {
  const [url, setUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ pages: CrawledPage[]; sitemapUrl: string } | null>(null)

  const handleCrawl = async () => {
    if (!url.trim()) {
      setError('Website URL is required')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          project_id: projectId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to crawl website')
      }

      setResults({
        pages: result.data.pages,
        sitemapUrl: result.data.sitemap_url
      })

      if (onSuccess) {
        onSuccess(result.data.pages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while crawling')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Crawl Client Website</CardTitle>
          <CardDescription>
            Enter the client&apos;s website URL to automatically discover their existing pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
              />
              <Button onClick={handleCrawl} disabled={isLoading || !url.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  'Crawl'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll look for sitemap.xml to discover all pages
            </p>
          </div>
        </CardContent>
      </Card>

      {results && <CrawlResults pages={results.pages} sitemapUrl={results.sitemapUrl} />}
    </div>
  )
}
