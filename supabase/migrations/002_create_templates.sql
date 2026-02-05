-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{"pages": []}',
  services JSONB NOT NULL DEFAULT '[]',
  url_patterns JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for templates table
CREATE INDEX IF NOT EXISTS templates_name_idx ON public.templates(name);
CREATE INDEX IF NOT EXISTS templates_is_active_idx ON public.templates(is_active);
CREATE INDEX IF NOT EXISTS templates_created_by_idx ON public.templates(created_by);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for templates
CREATE TRIGGER handle_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.templates IS 'Sitemap templates that define standard page structures for industries';
COMMENT ON COLUMN public.templates.structure IS 'Nested page structure as JSONB - see 03_DATA_MODELS.md for schema';
COMMENT ON COLUMN public.templates.services IS 'Available services for this template as JSONB array';
COMMENT ON COLUMN public.templates.url_patterns IS 'URL pattern configurations for generating page URLs';
