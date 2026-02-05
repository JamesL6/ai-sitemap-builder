import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { TemplateInsert } from '@/types/database'

// GET /api/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Get user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = userProfile?.role === 'admin'
    
    // Check for include_inactive query param
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    // Build query
    let query = supabase
      .from('templates')
      .select('id, name, description, services, is_active, created_at, updated_at')
      .order('name')

    // Non-admins can only see active templates
    // Admins see all unless include_inactive is false
    if (!isAdmin || !includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Templates fetch error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to fetch templates', 500)
    }

    return apiResponse(templates)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// POST /api/templates - Create new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Check admin role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userProfile?.role !== 'admin') {
      return apiError('AUTH_FORBIDDEN', 'Admin access required', 403)
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return apiError('VAL_INVALID_INPUT', 'Template name is required', 400)
    }

    // Prepare template data
    const templateData: TemplateInsert = {
      name: body.name,
      description: body.description || null,
      structure: body.structure || { pages: [] },
      services: body.services || [],
      url_patterns: body.url_patterns || {},
      is_active: body.is_active !== false,
      created_by: user.id
    }

    // Insert template
    const { data: template, error } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Template create error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to create template', 500)
    }

    return apiResponse(template, 201)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
