-- Create page_type enum
DO $$ BEGIN
  CREATE TYPE page_type AS ENUM ('standard', 'service', 'location', 'service_location');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create node_source enum
DO $$ BEGIN
  CREATE TYPE node_source AS ENUM ('template', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sitemap_nodes table
CREATE TABLE IF NOT EXISTS public.sitemap_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  page_type page_type NOT NULL DEFAULT 'standard',
  parent_id UUID REFERENCES public.sitemap_nodes(id) ON DELETE CASCADE,
  source node_source NOT NULL DEFAULT 'template',
  client_original_url VARCHAR(500),
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for sitemap_nodes table
CREATE INDEX IF NOT EXISTS sitemap_nodes_project_id_idx ON public.sitemap_nodes(project_id);
CREATE INDEX IF NOT EXISTS sitemap_nodes_parent_id_idx ON public.sitemap_nodes(parent_id);
CREATE INDEX IF NOT EXISTS sitemap_nodes_source_idx ON public.sitemap_nodes(source);
CREATE INDEX IF NOT EXISTS sitemap_nodes_page_type_idx ON public.sitemap_nodes(page_type);

-- Enable RLS
ALTER TABLE public.sitemap_nodes ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for sitemap_nodes
CREATE TRIGGER handle_sitemap_nodes_updated_at
  BEFORE UPDATE ON public.sitemap_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.sitemap_nodes IS 'Individual pages/nodes in the generated sitemap';
COMMENT ON COLUMN public.sitemap_nodes.page_type IS 'Type: standard, service, location, service_location';
COMMENT ON COLUMN public.sitemap_nodes.source IS 'Source: template or client';
COMMENT ON COLUMN public.sitemap_nodes.client_original_url IS 'Original URL from client site (if source = client)';
COMMENT ON COLUMN public.sitemap_nodes.position IS 'Sort order among siblings';
COMMENT ON COLUMN public.sitemap_nodes.metadata IS 'Additional metadata as JSONB';
