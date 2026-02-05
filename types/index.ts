// Database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <your-project-id> > types/database.ts

export interface Project {
  id: string
  name: string
  client_url: string | null
  template_id: string | null
  services_config: any[]
  locations: any[]
  status: string
  created_by: string
  created_at: string
  updated_at: string | null
}

export interface Template {
  id: string
  name: string
  description: string | null
  structure: any
  services: any[]
  is_active: boolean
  created_by: string
  created_at: string
}

export interface SitemapNode {
  id: string
  project_id: string
  title: string
  url: string | null
  page_type: 'standard' | 'service' | 'location' | 'service_location'
  parent_id: string | null
  source: 'template' | 'client'
  client_original_url: string | null
  position: number
}
