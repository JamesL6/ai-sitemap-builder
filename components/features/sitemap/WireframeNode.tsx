'use client'

import { ExternalLink, Home, FileText, MapPin, Briefcase } from 'lucide-react'
import type { SitemapNode, PageType } from '@/types/database'

export type NodeStatus = 'matched' | 'template-only' | 'client-only' | 'uncertain'

export interface WireframeNodeData {
  id: string
  title: string
  url?: string | null
  pageType: PageType
  source: 'template' | 'client'
  status?: NodeStatus
  confidence?: number
  clientOriginalUrl?: string | null
  children?: WireframeNodeData[]
}

interface WireframeNodeProps {
  node: WireframeNodeData
  onClick?: (node: WireframeNodeData) => void
  isSelected?: boolean
}

const pageTypeIcons: Record<PageType, React.ComponentType<{ className?: string }>> = {
  standard: FileText,
  service: Briefcase,
  location: MapPin,
  service_location: MapPin
}

const statusColors: Record<NodeStatus, { bg: string; border: string; text: string; badge: string }> = {
  'matched': {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    badge: 'bg-green-100 text-green-700'
  },
  'template-only': {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-700'
  },
  'client-only': {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    badge: 'bg-orange-100 text-orange-700'
  },
  'uncertain': {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-900',
    badge: 'bg-gray-100 text-gray-700'
  }
}

export function WireframeNode({ node, onClick, isSelected }: WireframeNodeProps) {
  const status = node.status || (node.source === 'template' ? 'template-only' : 'client-only')
  const colors = statusColors[status]
  const Icon = node.title.toLowerCase() === 'home' ? Home : pageTypeIcons[node.pageType]

  const handleClick = () => {
    onClick?.(node)
  }

  return (
    <div
      onClick={handleClick}
      className={`
        min-w-[200px] max-w-[280px] rounded-lg border-2 p-3 cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${colors.bg} ${colors.border}
        ${isSelected ? 'ring-2 ring-offset-2 ring-primary shadow-lg' : ''}
      `}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colors.text}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm leading-tight ${colors.text} truncate`}>
            {node.title}
          </h3>
        </div>
      </div>

      {/* URL */}
      {node.url && (
        <p className="text-xs text-muted-foreground mt-1 truncate pl-6">
          {node.url}
        </p>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap pl-6">
        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.badge}`}>
          {node.pageType.replace('_', ' ')}
        </span>
        
        {status === 'matched' && node.confidence !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">
            {Math.round(node.confidence * 100)}% match
          </span>
        )}
        
        {status === 'uncertain' && node.confidence !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
            {Math.round(node.confidence * 100)}% uncertain
          </span>
        )}
        
        {status === 'client-only' && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
            from client
          </span>
        )}
      </div>

      {/* Client original URL if different */}
      {node.clientOriginalUrl && (
        <a
          href={node.clientOriginalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-2 pl-6"
        >
          <ExternalLink className="h-3 w-3" />
          Original
        </a>
      )}
    </div>
  )
}
