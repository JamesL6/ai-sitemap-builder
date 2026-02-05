'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SitemapNode as SitemapNodeType } from '@/types/database'

interface SitemapNodeProps {
  node: SitemapNodeType
  depth?: number
  children?: SitemapNodeType[]
  onEdit?: (node: SitemapNodeType) => void
  onDelete?: (nodeId: string) => void
}

export function SitemapNode({ node, depth = 0, children = [], onEdit, onDelete }: SitemapNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = children.length > 0

  // Color coding based on source
  const bgColor = node.source === 'template' 
    ? 'bg-blue-50 border-blue-200' 
    : 'bg-orange-50 border-orange-200'
  
  const textColor = node.source === 'template'
    ? 'text-blue-900'
    : 'text-orange-900'

  const badgeColor = node.source === 'template'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-orange-100 text-orange-700'

  return (
    <div style={{ marginLeft: `${depth * 24}px` }} className="mb-2">
      <div className={`border rounded-md p-3 ${bgColor} transition-all hover:shadow-sm`}>
        <div className="flex items-start gap-2">
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium ${textColor}`}>{node.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${badgeColor}`}>
                {node.page_type}
              </span>
              {node.source === 'client' && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  from client
                </span>
              )}
            </div>
            
            {node.url && (
              <p className="text-sm text-muted-foreground mt-1">{node.url}</p>
            )}
            
            {node.client_original_url && (
              <a
                href={node.client_original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
              >
                Original: {node.client_original_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(node)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {children.map(child => (
            <SitemapNode
              key={child.id}
              node={child}
              depth={depth + 1}
              children={[]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
