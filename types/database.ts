// Database types matching Supabase schema
// These types are manually created to match the migrations in /supabase/migrations/
// For auto-generation, run: npx supabase gen types typescript --project-id <your-project-id> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'user' | 'admin'
export type ProjectStatus = 'draft' | 'crawled' | 'compared' | 'finalized' | 'archived'
export type PageType = 'standard' | 'service' | 'location' | 'service_location'
export type NodeSource = 'template' | 'client'

// =====================================================
// TABLE TYPES
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string | null
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          structure: TemplateStructure
          services: TemplateService[]
          url_patterns: Json
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          structure?: TemplateStructure
          services?: TemplateService[]
          url_patterns?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          structure?: TemplateStructure
          services?: TemplateService[]
          url_patterns?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          client_url: string | null
          template_id: string | null
          services_config: ServiceConfig[]
          locations: Location[]
          crawl_data: Json | null
          comparison_result: Json | null
          status: ProjectStatus
          created_by: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          client_url?: string | null
          template_id?: string | null
          services_config?: ServiceConfig[]
          locations?: Location[]
          crawl_data?: Json | null
          comparison_result?: Json | null
          status?: ProjectStatus
          created_by: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          client_url?: string | null
          template_id?: string | null
          services_config?: ServiceConfig[]
          locations?: Location[]
          crawl_data?: Json | null
          comparison_result?: Json | null
          status?: ProjectStatus
          created_by?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      sitemap_nodes: {
        Row: {
          id: string
          project_id: string
          title: string
          url: string | null
          page_type: PageType
          parent_id: string | null
          source: NodeSource
          client_original_url: string | null
          position: number
          metadata: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          url?: string | null
          page_type?: PageType
          parent_id?: string | null
          source?: NodeSource
          client_original_url?: string | null
          position?: number
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          url?: string | null
          page_type?: PageType
          parent_id?: string | null
          source?: NodeSource
          client_original_url?: string | null
          position?: number
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Enums: {
      user_role: UserRole
      project_status: ProjectStatus
      page_type: PageType
      node_source: NodeSource
    }
  }
}

// =====================================================
// JSONB SCHEMA TYPES
// =====================================================

// Template Structure
export interface TemplateStructure {
  pages: TemplatePage[]
}

export interface TemplatePage {
  id: string
  title: string
  url_pattern: string
  is_service?: boolean
  is_location_parent?: boolean
  children?: TemplatePage[]
}

// Template Service
export interface TemplateService {
  id: string
  name: string
  url_slug: string
  category?: string
}

// Project Service Config
export interface ServiceConfig {
  service_id: string
  enabled: boolean
  custom_name?: string | null
  is_custom?: boolean
}

// Project Location
export interface Location {
  id: string
  name: string
  url_slug: string
}

// =====================================================
// CONVENIENCE TYPE ALIASES
// =====================================================

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Template = Database['public']['Tables']['templates']['Row']
export type TemplateInsert = Database['public']['Tables']['templates']['Insert']
export type TemplateUpdate = Database['public']['Tables']['templates']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type SitemapNode = Database['public']['Tables']['sitemap_nodes']['Row']
export type SitemapNodeInsert = Database['public']['Tables']['sitemap_nodes']['Insert']
export type SitemapNodeUpdate = Database['public']['Tables']['sitemap_nodes']['Update']
