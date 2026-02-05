/**
 * Export utilities for sitemap data
 */

import type { SitemapNode } from '@/types/database'

export interface ExportNode {
  title: string
  url: string | null
  pageType: string
  source: string
  originalUrl: string | null
  parent: string | null
  depth: number
}

/**
 * Build tree structure with depth information
 */
export function buildExportTree(nodes: SitemapNode[]): ExportNode[] {
  const nodeMap = new Map<string, SitemapNode>(nodes.map(n => [n.id, n]))
  const result: ExportNode[] = []

  function getDepth(node: SitemapNode): number {
    if (!node.parent_id) return 0
    const parent = nodeMap.get(node.parent_id)
    return parent ? getDepth(parent) + 1 : 0
  }

  function getParentTitle(parentId: string | null): string | null {
    if (!parentId) return null
    const parent = nodeMap.get(parentId)
    return parent?.title || null
  }

  function processNode(node: SitemapNode) {
    result.push({
      title: node.title,
      url: node.url,
      pageType: node.page_type,
      source: node.source,
      originalUrl: node.client_original_url,
      parent: getParentTitle(node.parent_id),
      depth: getDepth(node)
    })

    // Process children
    const children = nodes
      .filter(n => n.parent_id === node.id)
      .sort((a, b) => a.position - b.position)
    
    for (const child of children) {
      processNode(child)
    }
  }

  // Start with root nodes
  const rootNodes = nodes
    .filter(n => !n.parent_id)
    .sort((a, b) => a.position - b.position)
  
  for (const root of rootNodes) {
    processNode(root)
  }

  return result
}

/**
 * Convert nodes to CSV format
 */
export function nodesToCsv(nodes: SitemapNode[]): string {
  const exportNodes = buildExportTree(nodes)
  
  // CSV header
  const headers = ['Title', 'URL', 'Page Type', 'Source', 'Original URL', 'Parent', 'Depth']
  const rows = [headers.join(',')]

  // CSV rows
  for (const node of exportNodes) {
    const row = [
      escapeCsvValue(node.title),
      escapeCsvValue(node.url || ''),
      escapeCsvValue(node.pageType),
      escapeCsvValue(node.source),
      escapeCsvValue(node.originalUrl || ''),
      escapeCsvValue(node.parent || 'Root'),
      node.depth.toString()
    ]
    rows.push(row.join(','))
  }

  return rows.join('\n')
}

/**
 * Escape CSV value (handle commas and quotes)
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert nodes to JSON export format
 */
export function nodesToJson(nodes: SitemapNode[], projectName: string) {
  const exportNodes = buildExportTree(nodes)
  
  return {
    project_name: projectName,
    exported_at: new Date().toISOString(),
    total_pages: nodes.length,
    pages: exportNodes,
    metadata: {
      template_pages: nodes.filter(n => n.source === 'template').length,
      client_pages: nodes.filter(n => n.source === 'client').length,
      page_types: {
        standard: nodes.filter(n => n.page_type === 'standard').length,
        service: nodes.filter(n => n.page_type === 'service').length,
        location: nodes.filter(n => n.page_type === 'location').length,
        service_location: nodes.filter(n => n.page_type === 'service_location').length
      }
    }
  }
}
