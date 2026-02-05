import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { SitemapNodeInsert } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/projects/[id]/nodes/bulk - Create multiple nodes at once
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (projectError || !project) {
      return apiError('RES_NOT_FOUND', 'Project not found', 404)
    }

    // Parse request body
    const body = await request.json()
    
    // Validate nodes array
    if (!body.nodes || !Array.isArray(body.nodes) || body.nodes.length === 0) {
      return apiError('VAL_INVALID_INPUT', 'nodes array is required and must not be empty', 400)
    }

    // Prepare node data
    const nodeData: SitemapNodeInsert[] = body.nodes.map((node: any, index: number) => ({
      project_id: id,
      title: node.title || 'Untitled',
      url: node.url || null,
      page_type: node.page_type || 'standard',
      parent_id: node.parent_id || null,
      source: node.source || 'template',
      client_original_url: node.client_original_url || null,
      position: node.position !== undefined ? node.position : index,
      metadata: node.metadata || {}
    }))

    // Insert all nodes
    const { data: nodes, error } = await supabase
      .from('sitemap_nodes')
      .insert(nodeData)
      .select()

    if (error) {
      console.error('Bulk node create error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to create nodes', 500)
    }

    return apiResponse({
      created: nodes.length,
      nodes
    }, 201)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
