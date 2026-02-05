import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { SitemapNodeUpdate } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string; nodeId: string }>
}

// PUT /api/projects/[id]/nodes/[nodeId] - Update a node
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, nodeId } = await params
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

    // Prepare update data (only include fields that were provided)
    const updateData: SitemapNodeUpdate = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.url !== undefined) updateData.url = body.url
    if (body.page_type !== undefined) updateData.page_type = body.page_type
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id
    if (body.source !== undefined) updateData.source = body.source
    if (body.client_original_url !== undefined) updateData.client_original_url = body.client_original_url
    if (body.position !== undefined) updateData.position = body.position
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // Update node
    const { data: node, error } = await supabase
      .from('sitemap_nodes')
      .update(updateData)
      .eq('id', nodeId)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      console.error('Node update error:', error)
      if (error.code === 'PGRST116') {
        return apiError('RES_NOT_FOUND', 'Node not found', 404)
      }
      return apiError('SYS_DB_ERROR', 'Failed to update node', 500)
    }

    return apiResponse(node)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// DELETE /api/projects/[id]/nodes/[nodeId] - Delete a node
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, nodeId } = await params
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

    // Delete node (CASCADE will handle child nodes)
    const { error } = await supabase
      .from('sitemap_nodes')
      .delete()
      .eq('id', nodeId)
      .eq('project_id', id)

    if (error) {
      console.error('Node delete error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to delete node', 500)
    }

    return apiResponse({ deleted: true })
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
