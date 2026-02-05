import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { SitemapNodeInsert } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/nodes - List all nodes for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch all nodes for this project
    const { data: nodes, error } = await supabase
      .from('sitemap_nodes')
      .select('*')
      .eq('project_id', id)
      .order('position')

    if (error) {
      console.error('Nodes fetch error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to fetch nodes', 500)
    }

    return apiResponse(nodes)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// POST /api/projects/[id]/nodes - Create a new node
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
    
    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return apiError('VAL_INVALID_INPUT', 'Node title is required', 400)
    }

    // Prepare node data
    const nodeData: SitemapNodeInsert = {
      project_id: id,
      title: body.title,
      url: body.url || null,
      page_type: body.page_type || 'standard',
      parent_id: body.parent_id || null,
      source: body.source || 'template',
      client_original_url: body.client_original_url || null,
      position: body.position || 0,
      metadata: body.metadata || {}
    }

    // Insert node
    const { data: node, error } = await supabase
      .from('sitemap_nodes')
      .insert(nodeData)
      .select()
      .single()

    if (error) {
      console.error('Node create error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to create node', 500)
    }

    return apiResponse(node, 201)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
