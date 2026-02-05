'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface CrawledPage {
  url: string
  title: string
  lastModified?: string
}

interface CrawlResultsProps {
  pages: CrawledPage[]
  sitemapUrl: string
}

export function CrawlResults({ pages, sitemapUrl }: CrawlResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crawl Results</CardTitle>
        <CardDescription>
          Found {pages.length} pages from{' '}
          <a
            href={sitemapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            sitemap
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {pages.map((page, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-2 border rounded-md hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{page.title}</p>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-blue-600 truncate block"
                >
                  {page.url}
                </a>
              </div>
              {page.lastModified && (
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {new Date(page.lastModified).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
