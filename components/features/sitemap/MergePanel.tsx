'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Check, X, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import type { ComparisonResult, SitemapNode, ClientOnlyPage } from '@/types/database'

interface MergePanelProps {
  projectId: string
  comparisonResult: ComparisonResult
  existingNodes: SitemapNode[]
  onPageAdded?: (page: ClientOnlyPage, nodeId: string) => void
  onBulkAdd?: (pages: ClientOnlyPage[]) => void
}

interface PageWithState extends ClientOnlyPage {
  isAdded: boolean
  isAdding: boolean
  selectedParent: string | null
}

export function MergePanel({
  projectId,
  comparisonResult,
  existingNodes,
  onPageAdded,
  onBulkAdd
}: MergePanelProps) {
  const [pages, setPages] = useState<PageWithState[]>(
    comparisonResult.client_only.map(page => ({
      ...page,
      isAdded: false,
      isAdding: false,
      selectedParent: null
    }))
  )
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // Get potential parent nodes (typically top-level pages)
  const parentOptions = existingNodes.filter(node => 
    !node.parent_id || node.page_type === 'standard'
  ).sort((a, b) => a.title.localeCompare(b.title))

  const handleAddPage = async (pageIndex: number) => {
    const page = pages[pageIndex]
    if (page.isAdded || page.isAdding) return

    setPages(prev => prev.map((p, i) => 
      i === pageIndex ? { ...p, isAdding: true } : p
    ))

    try {
      const response = await fetch(`/api/projects/${projectId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          url: new URL(page.url).pathname,
          page_type: 'standard',
          source: 'client',
          client_original_url: page.url,
          parent_id: page.selectedParent,
          position: existingNodes.length + pageIndex
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add page')
      }

      setPages(prev => prev.map((p, i) => 
        i === pageIndex ? { ...p, isAdded: true, isAdding: false } : p
      ))

      onPageAdded?.(page, result.data.id)
    } catch (err) {
      console.error('Failed to add page:', err)
      setPages(prev => prev.map((p, i) => 
        i === pageIndex ? { ...p, isAdding: false } : p
      ))
      alert(err instanceof Error ? err.message : 'Failed to add page')
    }
  }

  const handleSelectParent = (pageIndex: number, parentId: string | null) => {
    setPages(prev => prev.map((p, i) => 
      i === pageIndex ? { ...p, selectedParent: parentId } : p
    ))
  }

  const handleToggleSelect = (url: string) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
      } else {
        newSet.add(url)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const notAddedUrls = pages.filter(p => !p.isAdded).map(p => p.url)
    setSelectedPages(new Set(notAddedUrls))
  }

  const handleDeselectAll = () => {
    setSelectedPages(new Set())
  }

  const handleBulkAdd = async () => {
    const pagesToAdd = pages.filter(p => selectedPages.has(p.url) && !p.isAdded)
    if (pagesToAdd.length === 0) return

    setIsBulkAdding(true)

    try {
      const nodes = pagesToAdd.map((page, index) => ({
        title: page.title,
        url: new URL(page.url).pathname,
        page_type: 'standard' as const,
        source: 'client' as const,
        client_original_url: page.url,
        parent_id: page.selectedParent,
        position: existingNodes.length + index
      }))

      const response = await fetch(`/api/projects/${projectId}/nodes/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add pages')
      }

      setPages(prev => prev.map(p => 
        selectedPages.has(p.url) ? { ...p, isAdded: true, isAdding: false } : p
      ))
      setSelectedPages(new Set())
      onBulkAdd?.(pagesToAdd)
    } catch (err) {
      console.error('Failed to bulk add pages:', err)
      alert(err instanceof Error ? err.message : 'Failed to add pages')
    } finally {
      setIsBulkAdding(false)
    }
  }

  const pendingPages = pages.filter(p => !p.isAdded)
  const addedPages = pages.filter(p => p.isAdded)
  const selectedCount = [...selectedPages].filter(url => 
    pages.find(p => p.url === url && !p.isAdded)
  ).length

  if (pages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Pages</CardTitle>
          <CardDescription>
            No unique client pages found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-5 w-5 text-green-600" />
            <span>All client pages match template pages</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Client-Only Pages
            </CardTitle>
            <CardDescription>
              {pendingPages.length} page{pendingPages.length !== 1 ? 's' : ''} found only on client site
            </CardDescription>
          </div>
          {pendingPages.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedPages.size > 0 ? handleDeselectAll : handleSelectAll}
              >
                {selectedPages.size > 0 ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                size="sm"
                onClick={handleBulkAdd}
                disabled={selectedCount === 0 || isBulkAdding}
              >
                {isBulkAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Selected ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Pages */}
        {pendingPages.length > 0 && (
          <div className="space-y-3">
            {pages.map((page, index) => {
              if (page.isAdded) return null
              
              return (
                <div 
                  key={page.url}
                  className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <Checkbox
                    checked={selectedPages.has(page.url)}
                    onCheckedChange={() => handleToggleSelect(page.url)}
                    disabled={page.isAdding}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-orange-900">{page.title}</span>
                      {page.suggested_category && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                          {page.suggested_category}
                        </span>
                      )}
                    </div>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-700 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {page.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    
                    {/* Parent selection */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Parent:</span>
                      <Select
                        value={page.selectedParent || 'root'}
                        onValueChange={(value) => handleSelectParent(index, value === 'root' ? null : value)}
                      >
                        <SelectTrigger className="h-7 text-xs w-[180px]">
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="root">Root (top level)</SelectItem>
                          {parentOptions.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddPage(index)}
                    disabled={page.isAdding}
                    className="shrink-0"
                  >
                    {page.isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Added Pages */}
        {addedPages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Added to Sitemap ({addedPages.length})
            </h4>
            <div className="space-y-2">
              {addedPages.map(page => (
                <div 
                  key={page.url}
                  className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm"
                >
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-green-800 truncate">{page.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
