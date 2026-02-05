import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { ProjectUpdate } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get single project with all data
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Fetch project (RLS ensures only owner can access)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error || !project) {
      return apiError('RES_NOT_FOUND', 'Project not found', 404)
    }

    return apiResponse(project)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Verify ownership
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !existingProject) {
      return apiError('RES_NOT_FOUND', 'Project not found', 404)
    }

    // Parse request body
    const body = await request.json()

    // Validate template_id if provided
    if (body.template_id) {
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('id')
        .eq('id', body.template_id)
        .eq('is_active', true)
        .single()

      if (templateError || !template) {
        return apiError('VAL_INVALID_INPUT', 'Invalid or inactive template', 400)
      }
    }

    // Validate status if provided
    const validStatuses = ['draft', 'crawled', 'compared', 'finalized', 'archived']
    if (body.status && !validStatuses.includes(body.status)) {
      return apiError('VAL_INVALID_INPUT', 'Invalid project status', 400)
    }

    // Prepare update data (only include fields that were provided)
    const updateData: ProjectUpdate = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.client_url !== undefined) updateData.client_url = body.client_url
    if (body.template_id !== undefined) updateData.template_id = body.template_id
    if (body.services_config !== undefined) updateData.services_config = body.services_config
    if (body.locations !== undefined) updateData.locations = body.locations
    if (body.crawl_data !== undefined) updateData.crawl_data = body.crawl_data
    if (body.comparison_result !== undefined) updateData.comparison_result = body.comparison_result
    if (body.status !== undefined) updateData.status = body.status

    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single()

    if (error) {
      console.error('Project update error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to update project', 500)
    }

    return apiResponse(project)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// DELETE /api/projects/[id] - Delete project and all sitemap nodes
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Delete project (RLS ensures only owner can delete, CASCADE handles nodes)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      console.error('Project delete error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to delete project', 500)
    }

    return apiResponse({ deleted: true })
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
