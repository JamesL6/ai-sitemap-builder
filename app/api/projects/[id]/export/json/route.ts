import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils/api-response'
import { nodesToJson } from '@/lib/utils/export'
import { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

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
      .select('id, name')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (projectError || !project) {
      return apiError('RES_NOT_FOUND', 'Project not found', 404)
    }

    // Fetch all nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('sitemap_nodes')
      .select('*')
      .eq('project_id', id)
      .order('position')

    if (nodesError) {
      console.error('Nodes fetch error:', nodesError)
      return apiError('SYS_DB_ERROR', 'Failed to fetch nodes', 500)
    }

    if (!nodes || nodes.length === 0) {
      return apiError('VAL_INVALID_INPUT', 'No sitemap nodes to export', 400)
    }

    // Convert to JSON export format
    const exportData = nodesToJson(nodes, project.name)

    return apiResponse(exportData)
  } catch (error) {
    console.error('Export JSON Error:', error)
    return apiError('SYS_INTERNAL', 'Internal server error', 500)
  }
}
