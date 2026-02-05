'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react'
import type { TemplatePage } from '@/types/database'

interface PageBuilderProps {
  pages: TemplatePage[]
  onChange: (pages: TemplatePage[]) => void
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function PageNode({ 
  page, 
  depth = 0, 
  onUpdate, 
  onRemove, 
  onAddChild 
}: { 
  page: TemplatePage
  depth?: number
  onUpdate: (id: string, updates: Partial<TemplatePage>) => void
  onRemove: (id: string) => void
  onAddChild: (parentId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = page.children && page.children.length > 0

  return (
    <div style={{ marginLeft: `${depth * 24}px` }} className="mb-2">
      <div className="border rounded-md p-3 bg-muted/50">
        <div className="flex items-start gap-2">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-4 mt-2" />
          )}

          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Page Title</Label>
                <Input
                  value={page.title}
                  onChange={(e) => onUpdate(page.id, { title: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">URL Pattern</Label>
                <Input
                  value={page.url_pattern}
                  onChange={(e) => onUpdate(page.id, { url_pattern: e.target.value })}
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${page.id}-multiply`}
                  checked={page.multiply_in_matrix || page.is_service || false}
                  onCheckedChange={(checked) => onUpdate(page.id, { multiply_in_matrix: checked as boolean, is_service: checked as boolean })}
                />
                <label htmlFor={`${page.id}-multiply`} className="text-xs cursor-pointer">
                  Multiply by locations
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${page.id}-location`}
                  checked={page.is_location_parent || false}
                  onCheckedChange={(checked) => onUpdate(page.id, { is_location_parent: checked as boolean })}
                />
                <label htmlFor={`${page.id}-location`} className="text-xs cursor-pointer">
                  Location parent
                </label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(page.multiply_in_matrix || page.is_service) && '📍 Will generate location variants (e.g., "Miami {title}")'}
              {page.is_location_parent && '📍 Location pages will be added as children'}
            </p>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onAddChild(page.id)}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemove(page.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2">
          {page.children!.map(child => (
            <PageNode
              key={child.id}
              page={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PageBuilder({ pages, onChange }: PageBuilderProps) {
  const [newPageTitle, setNewPageTitle] = useState('')

  const updatePage = (id: string, updates: Partial<TemplatePage>) => {
    const updateInTree = (pageList: TemplatePage[]): TemplatePage[] => {
      return pageList.map(page => {
        if (page.id === id) {
          return { ...page, ...updates }
        }
        if (page.children) {
          return { ...page, children: updateInTree(page.children) }
        }
        return page
      })
    }
    onChange(updateInTree(pages))
  }

  const removePage = (id: string) => {
    const removeFromTree = (pageList: TemplatePage[]): TemplatePage[] => {
      return pageList
        .filter(page => page.id !== id)
        .map(page => ({
          ...page,
          children: page.children ? removeFromTree(page.children) : []
        }))
    }
    onChange(removeFromTree(pages))
  }

  const addChild = (parentId: string) => {
    // Find parent page to get its URL pattern
    let parentUrlPattern = '/new-page'
    
    const findParent = (pageList: TemplatePage[]): TemplatePage | null => {
      for (const page of pageList) {
        if (page.id === parentId) return page
        if (page.children) {
          const found = findParent(page.children)
          if (found) return found
        }
      }
      return null
    }
    
    const parent = findParent(pages)
    if (parent) {
      // Pre-fill with parent's URL pattern
      parentUrlPattern = parent.url_pattern.endsWith('/') 
        ? parent.url_pattern + 'new-page'
        : parent.url_pattern + '/new-page'
    }

    const newPage: TemplatePage = {
      id: `page-${Date.now()}`,
      title: 'New Page',
      url_pattern: parentUrlPattern,
      children: []
    }

    const addToTree = (pageList: TemplatePage[]): TemplatePage[] => {
      return pageList.map(page => {
        if (page.id === parentId) {
          return {
            ...page,
            children: [...(page.children || []), newPage]
          }
        }
        if (page.children) {
          return { ...page, children: addToTree(page.children) }
        }
        return page
      })
    }
    onChange(addToTree(pages))
  }

  const addRootPage = () => {
    if (!newPageTitle.trim()) return

    const newPage: TemplatePage = {
      id: toSlug(newPageTitle),
      title: newPageTitle.trim(),
      url_pattern: '/' + toSlug(newPageTitle),
      children: []
    }

    onChange([...pages, newPage])
    setNewPageTitle('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Structure</CardTitle>
        <CardDescription>
          Build the template&apos;s page hierarchy ({pages.length} top-level pages)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.map(page => (
          <PageNode
            key={page.id}
            page={page}
            onUpdate={updatePage}
            onRemove={removePage}
            onAddChild={addChild}
          />
        ))}

        <div className="pt-4 border-t">
          <Label className="text-sm font-medium mb-2 block">Add Top-Level Page</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Page title (e.g., Home, Services, Contact)"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRootPage()}
            />
            <Button onClick={addRootPage} disabled={!newPageTitle.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
