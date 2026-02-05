-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
-- This migration creates all RLS policies for the application.
-- Note: RLS is enabled in each table's migration file.

-- =====================================================
-- TEMPLATES POLICIES
-- =====================================================

-- Anyone authenticated can view active templates
CREATE POLICY "Anyone can view active templates"
  ON public.templates
  FOR SELECT
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert templates
CREATE POLICY "Admins can insert templates"
  ON public.templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update templates
CREATE POLICY "Admins can update templates"
  ON public.templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete templates
CREATE POLICY "Admins can delete templates"
  ON public.templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (created_by = auth.uid());

-- Users can create projects for themselves
CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON public.projects
  FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- SITEMAP_NODES POLICIES
-- =====================================================

-- Users can view nodes in their own projects
CREATE POLICY "Users can view nodes in own projects"
  ON public.sitemap_nodes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = sitemap_nodes.project_id 
      AND created_by = auth.uid()
    )
  );

-- Users can create nodes in their own projects
CREATE POLICY "Users can create nodes in own projects"
  ON public.sitemap_nodes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = sitemap_nodes.project_id 
      AND created_by = auth.uid()
    )
  );

-- Users can update nodes in their own projects
CREATE POLICY "Users can update nodes in own projects"
  ON public.sitemap_nodes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = sitemap_nodes.project_id 
      AND created_by = auth.uid()
    )
  );

-- Users can delete nodes in their own projects
CREATE POLICY "Users can delete nodes in own projects"
  ON public.sitemap_nodes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = sitemap_nodes.project_id 
      AND created_by = auth.uid()
    )
  );
