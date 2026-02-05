'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SitemapNode, ComparisonResult, PageType } from '@/types/database'
import type { NodeStatus } from './WireframeNode'

interface WireframeTreeProps {
  nodes: SitemapNode[]
  comparisonResult?: ComparisonResult | null
  onNodeClick?: (node: TreeNode) => void
}

export interface TreeNode {
  id: string
  title: string
  url?: string | null
  pageType: PageType
  source: 'template' | 'client'
  status: NodeStatus
  confidence?: number
  clientOriginalUrl?: string | null
  children: TreeNode[]
  // Layout props (set during positioning)
  x: number
  y: number
  subtreeWidth: number
  collapsed: boolean
}

// Layout constants
const NODE_W = 180
const NODE_H = 64
const H_GAP = 24 // horizontal gap between sibling nodes
const V_GAP = 60 // vertical gap between levels
const PADDING = 60

// Status color mapping for inline use
const STATUS_COLORS: Record<NodeStatus, { bg: string; border: string; text: string; dot: string }> = {
  'matched':       { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#22c55e' },
  'template-only': { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a', dot: '#3b82f6' },
  'client-only':   { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', dot: '#f97316' },
  'uncertain':     { bg: '#f9fafb', border: '#d1d5db', text: '#1f2937', dot: '#9ca3af' },
}

export function WireframeTree({ nodes, comparisonResult, onNodeClick }: WireframeTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.7)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // Build tree structure from flat node array
  const rootNodes = useMemo((): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()

    // Create TreeNode objects
    nodes.forEach(node => {
      let status: NodeStatus = node.source === 'template' ? 'template-only' : 'client-only'
      let confidence: number | undefined

      if (comparisonResult) {
        const match = comparisonResult.matches.find(
          m => m.template_page.toLowerCase() === node.title.toLowerCase()
        )
        if (match) { status = 'matched'; confidence = match.confidence }

        const uncertain = comparisonResult.uncertain.find(
          u => u.template_page.toLowerCase() === node.title.toLowerCase()
        )
        if (uncertain) { status = 'uncertain'; confidence = uncertain.confidence }
      }

      nodeMap.set(node.id, {
        id: node.id,
        title: node.title,
        url: node.url,
        pageType: node.page_type,
        source: node.source,
        status,
        confidence,
        clientOriginalUrl: node.client_original_url,
        children: [],
        x: 0, y: 0,
        subtreeWidth: 0,
        collapsed: false,
      })
    })

    // Build parent-child edges
    const roots: TreeNode[] = []
    nodes.forEach(n => {
      const treeNode = nodeMap.get(n.id)!
      if (n.parent_id && nodeMap.has(n.parent_id)) {
        nodeMap.get(n.parent_id)!.children.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    })

    // Sort children by position
    const sortAll = (tn: TreeNode) => {
      tn.children.sort((a, b) => {
        const aN = nodes.find(x => x.id === a.id)
        const bN = nodes.find(x => x.id === b.id)
        return (aN?.position || 0) - (bN?.position || 0)
      })
      tn.children.forEach(sortAll)
    }
    roots.forEach(sortAll)

    return roots
  }, [nodes, comparisonResult])

  // Position tree nodes top-to-bottom, centered
  const layout = useMemo(() => {
    // Deep clone so we don't mutate memoised rootNodes each render
    const clone = (n: TreeNode): TreeNode => ({
      ...n,
      collapsed: collapsedIds.has(n.id),
      children: collapsedIds.has(n.id) ? [] : n.children.map(clone),
    })
    const roots = rootNodes.map(clone)

    // Pass 1 – measure subtree widths (bottom-up)
    const measure = (node: TreeNode) => {
      if (node.children.length === 0) {
        node.subtreeWidth = NODE_W
        return
      }
      node.children.forEach(measure)
      const childrenWidth = node.children.reduce((sum, c) => sum + c.subtreeWidth, 0)
        + H_GAP * (node.children.length - 1)
      node.subtreeWidth = Math.max(NODE_W, childrenWidth)
    }
    roots.forEach(measure)

    // Total width of all roots side-by-side
    const totalRootWidth = roots.reduce((s, r) => s + r.subtreeWidth, 0)
      + H_GAP * Math.max(0, roots.length - 1)

    // Pass 2 – assign x,y (top-down)
    const assign = (node: TreeNode, cx: number, level: number) => {
      node.x = cx - NODE_W / 2
      node.y = PADDING + level * (NODE_H + V_GAP)

      if (node.children.length === 0) return

      const childrenWidth = node.children.reduce((s, c) => s + c.subtreeWidth, 0)
        + H_GAP * (node.children.length - 1)
      let startX = cx - childrenWidth / 2

      node.children.forEach(child => {
        const childCx = startX + child.subtreeWidth / 2
        assign(child, childCx, level + 1)
        startX += child.subtreeWidth + H_GAP
      })
    }

    let startX = PADDING + totalRootWidth / 2
    if (roots.length > 1) {
      let runX = PADDING
      roots.forEach(root => {
        const cx = runX + root.subtreeWidth / 2
        assign(root, cx, 0)
        runX += root.subtreeWidth + H_GAP
      })
    } else if (roots.length === 1) {
      assign(roots[0], startX, 0)
    }

    // Collect flat list + connectors
    const flatNodes: TreeNode[] = []
    const connectors: { x1: number; y1: number; x2: number; y2: number }[] = []
    let maxX = 0, maxY = 0

    const collect = (node: TreeNode) => {
      flatNodes.push(node)
      maxX = Math.max(maxX, node.x + NODE_W)
      maxY = Math.max(maxY, node.y + NODE_H)
      node.children.forEach(child => {
        connectors.push({
          x1: node.x + NODE_W / 2,
          y1: node.y + NODE_H,
          x2: child.x + NODE_W / 2,
          y2: child.y,
        })
        collect(child)
      })
    }
    roots.forEach(collect)

    return {
      flatNodes,
      connectors,
      width: maxX + PADDING,
      height: maxY + PADDING,
    }
  }, [rootNodes, collapsedIds])

  // Toggle collapse
  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Zoom
  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2.5))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.15))
  const handleReset = () => {
    if (!containerRef.current) return
    const cw = containerRef.current.clientWidth
    const ch = containerRef.current.clientHeight
    const fitScale = Math.min(cw / layout.width, ch / layout.height, 1)
    setScale(Math.max(fitScale * 0.9, 0.15))
    setTranslate({ x: 0, y: 0 })
  }

  // Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setIsDragging(false)

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setScale(s => Math.min(Math.max(s + (e.deltaY > 0 ? -0.08 : 0.08), 0.15), 2.5))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Auto-fit on first render
  useEffect(() => {
    if (layout.flatNodes.length > 0) handleReset()
  }, [layout.flatNodes.length])

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No pages to display
      </div>
    )
  }

  // Check which nodes have children in the original tree (before collapse)
  const hasOriginalChildren = new Set<string>()
  const markHasChildren = (n: TreeNode) => {
    if (n.children.length > 0) hasOriginalChildren.add(n.id)
    n.children.forEach(markHasChildren)
  }
  rootNodes.forEach(markHasChildren)

  return (
    <div className="relative w-full h-[700px] bg-[#fafbfc] rounded-lg overflow-hidden border">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-sm border">
        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0">
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2.5 shadow-sm border">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            { label: 'Matched', color: '#22c55e' },
            { label: 'Template', color: '#3b82f6' },
            { label: 'Client', color: '#f97316' },
            { label: 'Uncertain', color: '#9ca3af' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Page count */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border">
        <span className="text-xs text-muted-foreground">{nodes.length} pages</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            width: layout.width,
            height: layout.height,
            position: 'relative',
          }}
        >
          {/* SVG connectors */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.width}
            height={layout.height}
          >
            {layout.connectors.map((c, i) => {
              const midY = c.y1 + (c.y2 - c.y1) * 0.45
              return (
                <path
                  key={i}
                  d={`M ${c.x1} ${c.y1} C ${c.x1} ${midY}, ${c.x2} ${midY}, ${c.x2} ${c.y2}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
              )
            })}
          </svg>

          {/* Node cards */}
          {layout.flatNodes.map(node => {
            const colors = STATUS_COLORS[node.status]
            const isSelected = selectedNodeId === node.id
            const isCollapsed = collapsedIds.has(node.id)
            const canCollapse = hasOriginalChildren.has(node.id)

            return (
              <div
                key={node.id}
                className="absolute transition-shadow duration-150"
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_W,
                  height: NODE_H,
                }}
              >
                <div
                  onClick={() => {
                    setSelectedNodeId(node.id)
                    onNodeClick?.(node)
                  }}
                  className="h-full rounded-lg border-2 px-3 py-2 cursor-pointer transition-all hover:shadow-md flex flex-col justify-center relative"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: isSelected ? '#6366f1' : colors.border,
                    boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.3)' : undefined,
                  }}
                >
                  {/* Status dot */}
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.dot }}
                  />

                  {/* Title */}
                  <p
                    className="text-xs font-semibold leading-tight truncate pr-4"
                    style={{ color: colors.text }}
                    title={node.title}
                  >
                    {node.title}
                  </p>

                  {/* URL */}
                  {node.url && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5" title={node.url}>
                      {node.url}
                    </p>
                  )}

                  {/* Confidence badge */}
                  {node.confidence !== undefined && (
                    <span
                      className="text-[9px] font-medium mt-1 self-start px-1 py-px rounded"
                      style={{ backgroundColor: colors.border, color: colors.text }}
                    >
                      {Math.round(node.confidence * 100)}%
                    </span>
                  )}

                  {/* Collapse toggle */}
                  {canCollapse && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCollapse(node.id)
                      }}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-slate-400 z-10 text-xs"
                      title={isCollapsed ? 'Expand children' : 'Collapse children'}
                    >
                      {isCollapsed ? `+${rootNodes.reduce((count, r) => {
                        const find = (n: TreeNode): number => {
                          if (n.id === node.id) return n.children.length
                          return n.children.reduce((s, c) => s + find(c), 0)
                        }
                        return count + find(r)
                      }, 0)}` : '−'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
