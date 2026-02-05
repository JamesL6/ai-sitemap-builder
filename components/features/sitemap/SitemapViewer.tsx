'use client'

import { useEffect, useState } from 'react'
import { SitemapNode as SitemapNodeComponent } from './SitemapNode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SitemapNode } from '@/types/database'

interface SitemapViewerProps {
  projectId: string
  onNodeCountUpdate?: (count: number) => void
}

export function SitemapViewer({ projectId, onNodeCountUpdate }: SitemapViewerProps) {
  const [nodes, setNodes] = useState<SitemapNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNodes()
  }, [projectId])

  const fetchNodes = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/nodes`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch nodes')
      }
      
      setNodes(result.data)
      if (onNodeCountUpdate) {
        onNodeCountUpdate(result.data.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Build tree structure from flat array
  const buildTree = (nodes: SitemapNode[]): SitemapNode[] => {
    const nodeMap = new Map<string, SitemapNode>(nodes.map(n => [n.id, n]))
    const rootNodes: SitemapNode[] = []

    for (const node of nodes) {
      if (!node.parent_id) {
        rootNodes.push(node)
      }
    }

    return rootNodes
  }

  const getChildren = (parentId: string): SitemapNode[] => {
    return nodes.filter(n => n.parent_id === parentId).sort((a, b) => a.position - b.position)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchNodes} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pages Yet</CardTitle>
          <CardDescription>
            Generate the location × service matrix to create your sitemap
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const rootNodes = buildTree(nodes)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitemap Structure</CardTitle>
        <CardDescription>
          {nodes.length} page{nodes.length !== 1 ? 's' : ''} in your sitemap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rootNodes.map(node => (
            <SitemapNodeComponent
              key={node.id}
              node={node}
              children={getChildren(node.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
