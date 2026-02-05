import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { NextRequest } from 'next/server'
import type { TemplateUpdate } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id] - Get single template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('AUTH_REQUIRED', 'Authentication required', 401)
    }

    // Get user role for checking access to inactive templates
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = userProfile?.role === 'admin'

    // Fetch template
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !template) {
      return apiError('RES_NOT_FOUND', 'Template not found', 404)
    }

    // Non-admins can't see inactive templates
    if (!template.is_active && !isAdmin) {
      return apiError('RES_NOT_FOUND', 'Template not found', 404)
    }

    return apiResponse(template)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// PUT /api/templates/[id] - Update template (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Prepare update data (only include fields that were provided)
    const updateData: TemplateUpdate = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.structure !== undefined) updateData.structure = body.structure
    if (body.services !== undefined) updateData.services = body.services
    if (body.url_patterns !== undefined) updateData.url_patterns = body.url_patterns
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update template
    const { data: template, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Template update error:', error)
      if (error.code === 'PGRST116') {
        return apiError('RES_NOT_FOUND', 'Template not found', 404)
      }
      return apiError('SYS_DB_ERROR', 'Failed to update template', 500)
    }

    return apiResponse(template)
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}

// DELETE /api/templates/[id] - Delete template (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Delete template
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Template delete error:', error)
      return apiError('SYS_DB_ERROR', 'Failed to delete template', 500)
    }

    return apiResponse({ deleted: true })
  } catch (error) {
    console.error('API Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
