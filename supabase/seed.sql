-- Seed data for AI Sitemap Builder
-- Updated to use new hierarchical structure with multiply_in_matrix flags

-- Restoration Company Template
INSERT INTO public.templates (id, name, description, structure, services, url_patterns, is_active) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Restoration Company',
  'Advanced sitemap template for restoration companies with nested service hierarchies. Supports water damage, fire damage, and mold services with detailed sub-services.',
  '{"pages": [
    {"id": "home", "title": "Home", "url_pattern": "/", "children": []},
    {"id": "about", "title": "About Us", "url_pattern": "/about", "children": []},
    {"id": "services", "title": "Services", "url_pattern": "/services", "children": [
      {"id": "water-damage", "title": "Water Damage Restoration", "url_pattern": "/water-damage", "multiply_in_matrix": true, "children": [
        {"id": "flood-cleanup", "title": "Flood Damage Cleanup", "url_pattern": "/water-damage/flood-cleanup", "multiply_in_matrix": true},
        {"id": "water-extraction", "title": "Water Extraction", "url_pattern": "/water-damage/water-extraction", "multiply_in_matrix": true},
        {"id": "structural-drying", "title": "Structural Drying", "url_pattern": "/water-damage/structural-drying", "multiply_in_matrix": true}
      ]},
      {"id": "fire-damage", "title": "Fire Damage Restoration", "url_pattern": "/fire-damage", "multiply_in_matrix": true, "children": [
        {"id": "smoke-damage", "title": "Smoke Damage Cleanup", "url_pattern": "/fire-damage/smoke-damage", "multiply_in_matrix": true},
        {"id": "soot-removal", "title": "Soot Removal", "url_pattern": "/fire-damage/soot-removal", "multiply_in_matrix": true}
      ]},
      {"id": "mold-remediation", "title": "Mold Remediation", "url_pattern": "/mold-remediation", "multiply_in_matrix": true, "children": [
        {"id": "mold-inspection", "title": "Mold Inspection", "url_pattern": "/mold-remediation/inspection", "multiply_in_matrix": true},
        {"id": "mold-removal", "title": "Mold Removal", "url_pattern": "/mold-remediation/removal", "multiply_in_matrix": true}
      ]},
      {"id": "storm-damage", "title": "Storm Damage Repair", "url_pattern": "/storm-damage", "multiply_in_matrix": true}
    ]},
    {"id": "service-areas", "title": "Service Areas", "url_pattern": "/service-areas", "is_location_parent": true, "children": []},
    {"id": "blog", "title": "Blog", "url_pattern": "/blog", "children": []},
    {"id": "contact", "title": "Contact Us", "url_pattern": "/contact", "children": []},
    {"id": "testimonials", "title": "Testimonials", "url_pattern": "/testimonials", "children": []},
    {"id": "faq", "title": "FAQ", "url_pattern": "/faq", "children": []}
  ]}',
  '[]',
  '{"service": "/{service_slug}", "location": "/service-areas/{location_slug}", "service_location": "/service-areas/{location_slug}/{page_slug}"}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  structure = EXCLUDED.structure,
  services = EXCLUDED.services,
  url_patterns = EXCLUDED.url_patterns,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- HVAC Company Template
INSERT INTO public.templates (id, name, description, structure, services, url_patterns, is_active) VALUES
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'HVAC Company',
  'Comprehensive HVAC template with cooling, heating, and maintenance service categories.',
  '{"pages": [
    {"id": "home", "title": "Home", "url_pattern": "/", "children": []},
    {"id": "about", "title": "About Us", "url_pattern": "/about", "children": []},
    {"id": "services", "title": "Services", "url_pattern": "/services", "children": [
      {"id": "cooling", "title": "Cooling Services", "url_pattern": "/cooling", "children": [
        {"id": "ac-repair", "title": "AC Repair", "url_pattern": "/cooling/ac-repair", "multiply_in_matrix": true},
        {"id": "ac-installation", "title": "AC Installation", "url_pattern": "/cooling/ac-installation", "multiply_in_matrix": true},
        {"id": "ac-maintenance", "title": "AC Maintenance", "url_pattern": "/cooling/ac-maintenance", "multiply_in_matrix": true}
      ]},
      {"id": "heating", "title": "Heating Services", "url_pattern": "/heating", "children": [
        {"id": "furnace-repair", "title": "Furnace Repair", "url_pattern": "/heating/furnace-repair", "multiply_in_matrix": true},
        {"id": "furnace-installation", "title": "Furnace Installation", "url_pattern": "/heating/furnace-installation", "multiply_in_matrix": true},
        {"id": "heat-pump", "title": "Heat Pump Services", "url_pattern": "/heating/heat-pump", "multiply_in_matrix": true}
      ]},
      {"id": "maintenance", "title": "Maintenance", "url_pattern": "/maintenance", "children": [
        {"id": "tune-up", "title": "HVAC Tune-Up", "url_pattern": "/maintenance/tune-up", "multiply_in_matrix": true},
        {"id": "duct-cleaning", "title": "Duct Cleaning", "url_pattern": "/maintenance/duct-cleaning", "multiply_in_matrix": true}
      ]}
    ]},
    {"id": "service-areas", "title": "Service Areas", "url_pattern": "/service-areas", "is_location_parent": true, "children": []},
    {"id": "financing", "title": "Financing", "url_pattern": "/financing", "children": []},
    {"id": "contact", "title": "Contact Us", "url_pattern": "/contact", "children": []}
  ]}',
  '[]',
  '{"service": "/{service_slug}", "location": "/service-areas/{location_slug}", "service_location": "/service-areas/{location_slug}/{page_slug}"}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  structure = EXCLUDED.structure,
  services = EXCLUDED.services,
  url_patterns = EXCLUDED.url_patterns,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Plumbing Company Template  
INSERT INTO public.templates (id, name, description, structure, services, url_patterns, is_active) VALUES
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Plumbing Company',
  'Full-service plumbing template with residential and commercial service categories.',
  '{"pages": [
    {"id": "home", "title": "Home", "url_pattern": "/", "children": []},
    {"id": "about", "title": "About Us", "url_pattern": "/about", "children": []},
    {"id": "services", "title": "Services", "url_pattern": "/services", "children": [
      {"id": "residential", "title": "Residential Plumbing", "url_pattern": "/residential", "children": [
        {"id": "drain-cleaning", "title": "Drain Cleaning", "url_pattern": "/residential/drain-cleaning", "multiply_in_matrix": true},
        {"id": "water-heater", "title": "Water Heater Services", "url_pattern": "/residential/water-heater", "multiply_in_matrix": true},
        {"id": "leak-repair", "title": "Leak Repair", "url_pattern": "/residential/leak-repair", "multiply_in_matrix": true}
      ]},
      {"id": "commercial", "title": "Commercial Plumbing", "url_pattern": "/commercial", "children": [
        {"id": "commercial-drain", "title": "Commercial Drain Services", "url_pattern": "/commercial/drain-services", "multiply_in_matrix": true},
        {"id": "backflow-testing", "title": "Backflow Testing", "url_pattern": "/commercial/backflow-testing", "multiply_in_matrix": true}
      ]},
      {"id": "emergency", "title": "Emergency Plumbing", "url_pattern": "/emergency-plumbing", "multiply_in_matrix": true}
    ]},
    {"id": "service-areas", "title": "Service Areas", "url_pattern": "/service-areas", "is_location_parent": true, "children": []},
    {"id": "contact", "title": "Contact Us", "url_pattern": "/contact", "children": []}
  ]}',
  '[]',
  '{"service": "/{service_slug}", "location": "/service-areas/{location_slug}", "service_location": "/service-areas/{location_slug}/{page_slug}"}',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  structure = EXCLUDED.structure,
  services = EXCLUDED.services,
  url_patterns = EXCLUDED.url_patterns,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
