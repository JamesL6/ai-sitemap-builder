'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, HelpCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import type { ComparisonResult, TemplateStructure, TemplatePage } from '@/types/database'

interface ComparisonWireframeProps {
  templateStructure: TemplateStructure
  comparisonResult: ComparisonResult
  onAddClientPage?: (page: ComparisonResult['client_only'][0]) => void
}

interface UnifiedTreeNode {
  id: string
  title: string
  url?: string
  status: 'matched' | 'template-only' | 'client-only' | 'uncertain'
  confidence?: number
  clientUrl?: string
  children: UnifiedTreeNode[]
}

export function ComparisonWireframe({ 
  templateStructure, 
  comparisonResult, 
  onAddClientPage 
}: ComparisonWireframeProps) {
  const [activeTab, setActiveTab] = useState<'unified' | 'summary'>('summary')

  // Build unified tree showing comparison results
  const unifiedTree = useMemo((): UnifiedTreeNode[] => {
    const buildNode = (page: TemplatePage): UnifiedTreeNode => {
      // Check if matched
      const match = comparisonResult.matches.find(
        m => m.template_page.toLowerCase() === page.title.toLowerCase()
      )
      
      // Check if uncertain
      const uncertain = comparisonResult.uncertain.find(
        u => u.template_page.toLowerCase() === page.title.toLowerCase()
      )

      let status: UnifiedTreeNode['status'] = 'template-only'
      let confidence: number | undefined
      let clientUrl: string | undefined

      if (match) {
        status = 'matched'
        confidence = match.confidence
        clientUrl = match.client_page.url
      } else if (uncertain) {
        status = 'uncertain'
        confidence = uncertain.confidence
        clientUrl = uncertain.client_page.url
      }

      return {
        id: page.id,
        title: page.title,
        url: page.url_pattern,
        status,
        confidence,
        clientUrl,
        children: page.children?.map(buildNode) || []
      }
    }

    return templateStructure.pages.map(buildNode)
  }, [templateStructure, comparisonResult])

  // Stats calculation
  const stats = useMemo(() => ({
    matched: comparisonResult.matches.length,
    templateOnly: comparisonResult.template_only.length,
    clientOnly: comparisonResult.client_only.length,
    uncertain: comparisonResult.uncertain.length,
    total: comparisonResult.matches.length + 
           comparisonResult.template_only.length + 
           comparisonResult.uncertain.length
  }), [comparisonResult])

  const renderTreeNode = (node: UnifiedTreeNode, depth: number = 0) => {
    const statusConfig = {
      'matched': {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        badge: 'bg-green-100 text-green-700'
      },
      'template-only': {
        icon: XCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-700'
      },
      'client-only': {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200',
        badge: 'bg-orange-100 text-orange-700'
      },
      'uncertain': {
        icon: HelpCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50 border-gray-200',
        badge: 'bg-gray-100 text-gray-700'
      }
    }

    const config = statusConfig[node.status]
    const Icon = config.icon

    return (
      <div key={node.id} className="space-y-2">
        <div 
          className={`border rounded-lg p-3 ${config.bg}`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{node.title}</span>
                {node.confidence !== undefined && (
                  <Badge variant="secondary" className={config.badge}>
                    {Math.round(node.confidence * 100)}%
                  </Badge>
                )}
              </div>
              {node.url && (
                <p className="text-sm text-muted-foreground mt-0.5">{node.url}</p>
              )}
              {node.clientUrl && (
                <a
                  href={node.clientUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Client: {node.clientUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        {node.children.map(child => renderTreeNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.matched}</p>
                <p className="text-xs text-green-600">Matched Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.templateOnly}</p>
                <p className="text-xs text-blue-600">Template Only</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{stats.clientOnly}</p>
                <p className="text-xs text-orange-600">Client Only</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-700">{stats.uncertain}</p>
                <p className="text-xs text-gray-600">Uncertain</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Details</CardTitle>
          <CardDescription>
            Review how template pages match with client pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'unified' | 'summary')}>
            <TabsList>
              <TabsTrigger value="summary">Summary Lists</TabsTrigger>
              <TabsTrigger value="unified">Unified Tree</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6 mt-4">
              {/* Matched Pages */}
              {comparisonResult.matches.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Matched Pages ({comparisonResult.matches.length})
                  </h4>
                  <div className="space-y-2">
                    {comparisonResult.matches.map((match, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">{match.template_page}</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {Math.round(match.confidence * 100)}% match
                          </Badge>
                        </div>
                        <a
                          href={match.client_page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 hover:underline flex items-center gap-1 mt-1"
                        >
                          → {match.client_page.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Only */}
              {comparisonResult.template_only.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-blue-600" />
                    Template Only ({comparisonResult.template_only.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResult.template_only.map((page, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                        {page}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Only */}
              {comparisonResult.client_only.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Client Only ({comparisonResult.client_only.length})
                  </h4>
                  <div className="space-y-2">
                    {comparisonResult.client_only.map((page, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-medium text-orange-900">{page.title}</span>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-700 hover:underline flex items-center gap-1"
                          >
                            {page.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {page.suggested_category && (
                            <span className="text-xs text-orange-600 mt-1 block">
                              Suggested: {page.suggested_category}
                            </span>
                          )}
                        </div>
                        {onAddClientPage && (
                          <button
                            onClick={() => onAddClientPage(page)}
                            className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            Add to Sitemap
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uncertain Matches */}
              {comparisonResult.uncertain.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gray-600" />
                    Uncertain Matches ({comparisonResult.uncertain.length})
                  </h4>
                  <div className="space-y-2">
                    {comparisonResult.uncertain.map((match, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{match.template_page}</span>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                            {Math.round(match.confidence * 100)}% uncertain
                          </Badge>
                        </div>
                        <a
                          href={match.client_page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-700 hover:underline flex items-center gap-1 mt-1"
                        >
                          → {match.client_page.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {match.reason && (
                          <p className="text-xs text-gray-500 mt-1 italic">{match.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="unified" className="mt-4">
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {unifiedTree.map(node => renderTreeNode(node))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
