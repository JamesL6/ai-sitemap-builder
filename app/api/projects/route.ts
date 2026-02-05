import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { ProjectInsert, ProjectStatus } from '@/types/database'

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ProjectStatus | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for projects with template info
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        client_url,
        status,
        created_at,
        updated_at,
        template:templates(id, name)
      `, { count: 'exact' })
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: projects, count, error } = await query

    if (error) {
      console.error('Projects fetch error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to fetch projects', 500)
    }

    return apiResponse(projects, 200, {
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return apiError('VAL_INVALID_INPUT', 'Project name is required', 400)
    }

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

    // Prepare project data
    const projectData: ProjectInsert = {
      name: body.name,
      client_url: body.client_url || null,
      template_id: body.template_id || null,
      services_config: [],
      locations: [],
      status: 'draft',
      created_by: user.id
    }

    // Insert project
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Project create error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to create project', 500)
    }

    return apiResponse(project, 201)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
