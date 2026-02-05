'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { WireframeNode, WireframeNodeData } from './WireframeNode'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SitemapNode, ComparisonResult } from '@/types/database'

interface WireframeTreeProps {
  nodes: SitemapNode[]
  comparisonResult?: ComparisonResult | null
  onNodeClick?: (node: WireframeNodeData) => void
}

interface TreeNode extends WireframeNodeData {
  children: TreeNode[]
  depth: number
  index: number
  x?: number
  y?: number
}

// Constants for layout
const NODE_WIDTH = 240
const NODE_HEIGHT = 100
const HORIZONTAL_GAP = 80
const VERTICAL_GAP = 24
const PADDING = 40

export function WireframeTree({ nodes, comparisonResult, onNodeClick }: WireframeTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Build tree structure from flat array
  const buildTree = useCallback((): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    
    // Create tree nodes with status info from comparison result
    nodes.forEach(node => {
      let status: WireframeNodeData['status'] = node.source === 'template' ? 'template-only' : 'client-only'
      let confidence: number | undefined
      
      if (comparisonResult) {
        // Check if matched
        const match = comparisonResult.matches.find(
          m => m.template_page.toLowerCase() === node.title.toLowerCase()
        )
        if (match) {
          status = 'matched'
          confidence = match.confidence
        }
        
        // Check if uncertain
        const uncertain = comparisonResult.uncertain.find(
          u => u.template_page.toLowerCase() === node.title.toLowerCase()
        )
        if (uncertain) {
          status = 'uncertain'
          confidence = uncertain.confidence
        }
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
        depth: 0,
        index: 0
      })
    })

    // Build parent-child relationships
    const rootNodes: TreeNode[] = []
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        const parent = nodeMap.get(node.parent_id)!
        parent.children.push(treeNode)
      } else {
        rootNodes.push(treeNode)
      }
    })

    // Sort children by position
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        const aNode = nodes.find(n => n.id === a.id)
        const bNode = nodes.find(n => n.id === b.id)
        return (aNode?.position || 0) - (bNode?.position || 0)
      })
      node.children.forEach(sortChildren)
    }
    rootNodes.forEach(sortChildren)

    return rootNodes
  }, [nodes, comparisonResult])

  // Calculate positions for each node
  const calculatePositions = useCallback((rootNodes: TreeNode[]): { nodes: TreeNode[], width: number, height: number } => {
    let maxX = 0
    let maxY = 0
    
    const assignPositions = (node: TreeNode, depth: number, startY: number): number => {
      node.depth = depth
      node.x = PADDING + depth * (NODE_WIDTH + HORIZONTAL_GAP)
      
      if (node.children.length === 0) {
        node.y = startY
        maxX = Math.max(maxX, (node.x || 0) + NODE_WIDTH)
        maxY = Math.max(maxY, (node.y || 0) + NODE_HEIGHT)
        return startY + NODE_HEIGHT + VERTICAL_GAP
      }

      let currentY = startY
      node.children.forEach((child, index) => {
        child.index = index
        currentY = assignPositions(child, depth + 1, currentY)
      })

      // Center parent vertically among its children
      const firstChild = node.children[0]
      const lastChild = node.children[node.children.length - 1]
      node.y = ((firstChild.y || 0) + (lastChild.y || 0)) / 2
      
      maxX = Math.max(maxX, (node.x || 0) + NODE_WIDTH)
      maxY = Math.max(maxY, (node.y || 0) + NODE_HEIGHT)
      
      return currentY
    }

    let currentY = PADDING
    rootNodes.forEach((root, index) => {
      root.index = index
      currentY = assignPositions(root, 0, currentY)
    })

    return {
      nodes: rootNodes,
      width: maxX + PADDING,
      height: maxY + PADDING
    }
  }, [])

  // Generate SVG paths for connectors
  const generateConnectors = useCallback((rootNodes: TreeNode[]): string[] => {
    const paths: string[] = []
    
    const traverse = (node: TreeNode) => {
      node.children.forEach(child => {
        const startX = (node.x || 0) + NODE_WIDTH
        const startY = (node.y || 0) + NODE_HEIGHT / 2
        const endX = child.x || 0
        const endY = (child.y || 0) + NODE_HEIGHT / 2
        
        // Create smooth bezier curve
        const midX = startX + (endX - startX) / 2
        paths.push(`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`)
        
        traverse(child)
      })
    }
    
    rootNodes.forEach(traverse)
    return paths
  }, [])

  const tree = buildTree()
  const { nodes: positionedTree, width, height } = calculatePositions(tree)
  const connectors = generateConnectors(positionedTree)

  // Flatten tree for rendering
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []
    const traverse = (node: TreeNode) => {
      result.push(node)
      node.children.forEach(traverse)
    }
    nodes.forEach(traverse)
    return result
  }

  const flatNodes = flattenTree(positionedTree)

  // Handle zoom
  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 2))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.3))
  const handleReset = () => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleNodeClick = (node: WireframeNodeData) => {
    setSelectedNodeId(node.id)
    onNodeClick?.(node)
  }

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(s => Math.min(Math.max(s + delta, 0.3), 2))
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No pages to display
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px] bg-muted/30 rounded-lg overflow-hidden border">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center px-2 text-sm text-muted-foreground min-w-[50px] justify-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-300 border border-green-400" />
            <span className="text-xs text-muted-foreground">Matched</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-300 border border-blue-400" />
            <span className="text-xs text-muted-foreground">Template Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-300 border border-orange-400" />
            <span className="text-xs text-muted-foreground">Client Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300 border border-gray-400" />
            <span className="text-xs text-muted-foreground">Uncertain</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            width: width,
            height: height,
            position: 'relative'
          }}
        >
          {/* SVG Connectors */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: width, height: height }}
          >
            {connectors.map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Nodes */}
          {flatNodes.map(node => (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: node.x,
                top: node.y,
                width: NODE_WIDTH
              }}
            >
              <WireframeNode
                node={node}
                onClick={handleNodeClick}
                isSelected={selectedNodeId === node.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
