'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, ExternalLink, Loader2, AlertTriangle, Search } from 'lucide-react'
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

const PAGE_SIZE = 25

export function MergePanel({
  projectId,
  comparisonResult,
  existingNodes,
  onPageAdded,
  onBulkAdd
}: MergePanelProps) {
  const [pageStates, setPageStates] = useState<Map<string, PageWithState>>(() => {
    const map = new Map<string, PageWithState>()
    comparisonResult.client_only.forEach(page => {
      map.set(page.url, {
        ...page,
        isAdded: false,
        isAdding: false,
        selectedParent: null
      })
    })
    return map
  })
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)

  // Get potential parent nodes
  const parentOptions = existingNodes.filter(node => 
    !node.parent_id || node.page_type === 'standard'
  ).sort((a, b) => a.title.localeCompare(b.title))

  // Category counts
  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    comparisonResult.client_only.forEach(page => {
      const cat = page.suggested_category || 'standard'
      cats.set(cat, (cats.get(cat) || 0) + 1)
    })
    return cats
  }, [comparisonResult.client_only])

  // Filter pages
  const filteredPages = useMemo(() => {
    let pages = comparisonResult.client_only

    if (categoryFilter !== 'all') {
      pages = pages.filter(p => (p.suggested_category || 'standard') === categoryFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      pages = pages.filter(p => 
        p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
      )
    }

    return pages
  }, [comparisonResult.client_only, search, categoryFilter])

  const pageCount = Math.ceil(filteredPages.length / PAGE_SIZE)
  const visiblePages = filteredPages.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  const handleAddPage = async (pageUrl: string) => {
    const page = pageStates.get(pageUrl)
    if (!page || page.isAdded || page.isAdding) return

    setPageStates(prev => {
      const next = new Map(prev)
      next.set(pageUrl, { ...page, isAdding: true })
      return next
    })

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
          position: existingNodes.length
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add page')
      }

      setPageStates(prev => {
        const next = new Map(prev)
        next.set(pageUrl, { ...page, isAdded: true, isAdding: false })
        return next
      })

      onPageAdded?.(page, result.data.id)
    } catch (err) {
      console.error('Failed to add page:', err)
      setPageStates(prev => {
        const next = new Map(prev)
        next.set(pageUrl, { ...page, isAdding: false })
        return next
      })
      alert(err instanceof Error ? err.message : 'Failed to add page')
    }
  }

  const handleSelectParent = (pageUrl: string, parentId: string | null) => {
    setPageStates(prev => {
      const next = new Map(prev)
      const page = next.get(pageUrl)
      if (page) {
        next.set(pageUrl, { ...page, selectedParent: parentId })
      }
      return next
    })
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

  const handleSelectAllVisible = () => {
    const visibleUrls = visiblePages
      .filter(p => !pageStates.get(p.url)?.isAdded)
      .map(p => p.url)
    
    const allSelected = visibleUrls.every(url => selectedPages.has(url))
    
    if (allSelected) {
      setSelectedPages(prev => {
        const newSet = new Set(prev)
        visibleUrls.forEach(url => newSet.delete(url))
        return newSet
      })
    } else {
      setSelectedPages(prev => {
        const newSet = new Set(prev)
        visibleUrls.forEach(url => newSet.add(url))
        return newSet
      })
    }
  }

  const handleBulkAdd = async () => {
    const pagesToAdd = [...selectedPages]
      .map(url => pageStates.get(url))
      .filter((p): p is PageWithState => !!p && !p.isAdded)
    
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

      setPageStates(prev => {
        const next = new Map(prev)
        pagesToAdd.forEach(page => {
          next.set(page.url, { ...page, isAdded: true, isAdding: false })
        })
        return next
      })
      setSelectedPages(new Set())
      onBulkAdd?.(pagesToAdd)
    } catch (err) {
      console.error('Failed to bulk add pages:', err)
      alert(err instanceof Error ? err.message : 'Failed to add pages')
    } finally {
      setIsBulkAdding(false)
    }
  }

  const addedCount = [...pageStates.values()].filter(p => p.isAdded).length
  const pendingCount = comparisonResult.client_only.length - addedCount
  const selectedCount = [...selectedPages].filter(url => 
    !pageStates.get(url)?.isAdded
  ).length

  if (comparisonResult.client_only.length === 0) {
    return null
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
              {pendingCount} pending, {addedCount} added of {comparisonResult.client_only.length} total
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllVisible}
            >
              {visiblePages.every(p => selectedPages.has(p.url) || pageStates.get(p.url)?.isAdded)
                ? 'Deselect Page'
                : 'Select Page'}
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages by title or URL..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0) }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={categoryFilter === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => { setCategoryFilter('all'); setCurrentPage(0) }}
            >
              All ({comparisonResult.client_only.length})
            </Button>
            {Array.from(categories).map(([cat, count]) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => { setCategoryFilter(cat); setCurrentPage(0) }}
              >
                {cat} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Results info */}
        <p className="text-xs text-muted-foreground">
          Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredPages.length)} of {filteredPages.length} pages
        </p>

        {/* Page list */}
        <div className="space-y-2">
          {visiblePages.map((page) => {
            const state = pageStates.get(page.url)
            if (!state) return null
            
            if (state.isAdded) {
              return (
                <div 
                  key={page.url}
                  className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm"
                >
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-green-800 truncate">{page.title}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs shrink-0">Added</Badge>
                </div>
              )
            }

            return (
              <div 
                key={page.url}
                className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <Checkbox
                  checked={selectedPages.has(page.url)}
                  onCheckedChange={() => handleToggleSelect(page.url)}
                  disabled={state.isAdding}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-orange-900">{page.title}</span>
                    {page.suggested_category && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                        {page.suggested_category}
                      </Badge>
                    )}
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-700 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {page.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  
                  {/* Parent selection */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Parent:</span>
                    <Select
                      value={state.selectedParent || 'root'}
                      onValueChange={(value) => handleSelectParent(page.url, value === 'root' ? null : value)}
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
                  onClick={() => handleAddPage(page.url)}
                  disabled={state.isAdding}
                  className="shrink-0"
                >
                  {state.isAdding ? (
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

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
