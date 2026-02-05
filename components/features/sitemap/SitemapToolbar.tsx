'use client'

import { Button } from '@/components/ui/button'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'

interface SitemapToolbarProps {
  projectId: string
  nodeCount: number
}

export function SitemapToolbar({ projectId, nodeCount }: SitemapToolbarProps) {
  const handleExportCsv = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export/csv`)
      
      if (!response.ok) {
        throw new Error('Failed to export CSV')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitemap-${projectId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export CSV')
    }
  }

  const handleExportJson = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export/json`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to export JSON')
      }

      // Download as JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitemap-${projectId}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export JSON')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
      <div>
        <p className="text-sm font-medium">Export Sitemap</p>
        <p className="text-xs text-muted-foreground">
          {nodeCount} page{nodeCount !== 1 ? 's' : ''} ready to export
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={nodeCount === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJson} disabled={nodeCount === 0}>
          <FileJson className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
    </div>
  )
}
