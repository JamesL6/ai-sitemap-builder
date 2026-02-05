-- Create project_status enum type
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('draft', 'crawled', 'compared', 'finalized', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_url VARCHAR(500),
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  services_config JSONB NOT NULL DEFAULT '[]',
  locations JSONB NOT NULL DEFAULT '[]',
  crawl_data JSONB,
  comparison_result JSONB,
  status project_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS projects_created_by_idx ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_template_id_idx ON public.projects(template_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for projects
CREATE TRIGGER handle_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.projects IS 'User projects containing sitemap configurations and generated data';
COMMENT ON COLUMN public.projects.services_config IS 'Services enabled for this project as JSONB array';
COMMENT ON COLUMN public.projects.locations IS 'List of locations/cities as JSONB array';
COMMENT ON COLUMN public.projects.crawl_data IS 'Raw crawl results from client site';
COMMENT ON COLUMN public.projects.comparison_result IS 'AI comparison results between template and client site';
COMMENT ON COLUMN public.projects.status IS 'Project status: draft, crawled, compared, finalized, archived';
