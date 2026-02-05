-- Seed data for AI Sitemap Builder
-- Run this after migrations to populate initial data

-- Note: This seed creates a template without created_by since we don't have an admin user yet.
-- In production, create an admin user first and update the created_by field.

-- Restoration Company Template
INSERT INTO public.templates (id, name, description, structure, services, url_patterns, is_active) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Restoration Company',
  'Standard sitemap template for water damage, fire damage, and mold restoration companies. Includes service pages, location pages, and service+location combinations.',
  '{
    "pages": [
      {
        "id": "home",
        "title": "Home",
        "url_pattern": "/",
        "children": []
      },
      {
        "id": "about",
        "title": "About Us",
        "url_pattern": "/about",
        "children": []
      },
      {
        "id": "services",
        "title": "Services",
        "url_pattern": "/services",
        "children": [
          {
            "id": "water-damage",
            "title": "Water Damage Restoration",
            "url_pattern": "/water-damage",
            "is_service": true
          },
          {
            "id": "fire-damage",
            "title": "Fire Damage Restoration",
            "url_pattern": "/fire-damage",
            "is_service": true
          },
          {
            "id": "mold-remediation",
            "title": "Mold Remediation",
            "url_pattern": "/mold-remediation",
            "is_service": true
          },
          {
            "id": "storm-damage",
            "title": "Storm Damage Repair",
            "url_pattern": "/storm-damage",
            "is_service": true
          }
        ]
      },
      {
        "id": "service-areas",
        "title": "Service Areas",
        "url_pattern": "/service-areas",
        "is_location_parent": true,
        "children": []
      },
      {
        "id": "blog",
        "title": "Blog",
        "url_pattern": "/blog",
        "children": []
      },
      {
        "id": "contact",
        "title": "Contact Us",
        "url_pattern": "/contact",
        "children": []
      },
      {
        "id": "testimonials",
        "title": "Testimonials",
        "url_pattern": "/testimonials",
        "children": []
      },
      {
        "id": "faq",
        "title": "FAQ",
        "url_pattern": "/faq",
        "children": []
      }
    ]
  }',
  '[
    {"id": "water-damage", "name": "Water Damage Restoration", "url_slug": "water-damage", "category": "restoration"},
    {"id": "fire-damage", "name": "Fire Damage Restoration", "url_slug": "fire-damage", "category": "restoration"},
    {"id": "mold-remediation", "name": "Mold Remediation", "url_slug": "mold-remediation", "category": "restoration"},
    {"id": "storm-damage", "name": "Storm Damage Repair", "url_slug": "storm-damage", "category": "restoration"},
    {"id": "sewage-cleanup", "name": "Sewage Cleanup", "url_slug": "sewage-cleanup", "category": "cleanup"},
    {"id": "biohazard", "name": "Biohazard Cleanup", "url_slug": "biohazard-cleanup", "category": "cleanup"},
    {"id": "smoke-odor", "name": "Smoke & Odor Removal", "url_slug": "smoke-odor-removal", "category": "restoration"},
    {"id": "content-restoration", "name": "Content Restoration", "url_slug": "content-restoration", "category": "restoration"}
  ]',
  '{
    "service": "/{service_slug}",
    "location": "/service-areas/{location_slug}",
    "service_location": "/{location_slug}-{service_slug}"
  }',
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
  'Standard sitemap template for heating, ventilation, and air conditioning companies. Includes residential and commercial service pages.',
  '{
    "pages": [
      {
        "id": "home",
        "title": "Home",
        "url_pattern": "/",
        "children": []
      },
      {
        "id": "about",
        "title": "About Us",
        "url_pattern": "/about",
        "children": []
      },
      {
        "id": "services",
        "title": "Services",
        "url_pattern": "/services",
        "children": [
          {
            "id": "ac-repair",
            "title": "AC Repair",
            "url_pattern": "/ac-repair",
            "is_service": true
          },
          {
            "id": "ac-installation",
            "title": "AC Installation",
            "url_pattern": "/ac-installation",
            "is_service": true
          },
          {
            "id": "heating-repair",
            "title": "Heating Repair",
            "url_pattern": "/heating-repair",
            "is_service": true
          },
          {
            "id": "furnace-installation",
            "title": "Furnace Installation",
            "url_pattern": "/furnace-installation",
            "is_service": true
          },
          {
            "id": "hvac-maintenance",
            "title": "HVAC Maintenance",
            "url_pattern": "/hvac-maintenance",
            "is_service": true
          }
        ]
      },
      {
        "id": "service-areas",
        "title": "Service Areas",
        "url_pattern": "/service-areas",
        "is_location_parent": true,
        "children": []
      },
      {
        "id": "financing",
        "title": "Financing",
        "url_pattern": "/financing",
        "children": []
      },
      {
        "id": "contact",
        "title": "Contact Us",
        "url_pattern": "/contact",
        "children": []
      }
    ]
  }',
  '[
    {"id": "ac-repair", "name": "AC Repair", "url_slug": "ac-repair", "category": "cooling"},
    {"id": "ac-installation", "name": "AC Installation", "url_slug": "ac-installation", "category": "cooling"},
    {"id": "heating-repair", "name": "Heating Repair", "url_slug": "heating-repair", "category": "heating"},
    {"id": "furnace-installation", "name": "Furnace Installation", "url_slug": "furnace-installation", "category": "heating"},
    {"id": "hvac-maintenance", "name": "HVAC Maintenance", "url_slug": "hvac-maintenance", "category": "maintenance"},
    {"id": "duct-cleaning", "name": "Duct Cleaning", "url_slug": "duct-cleaning", "category": "maintenance"},
    {"id": "indoor-air-quality", "name": "Indoor Air Quality", "url_slug": "indoor-air-quality", "category": "air-quality"}
  ]',
  '{
    "service": "/{service_slug}",
    "location": "/service-areas/{location_slug}",
    "service_location": "/{location_slug}-{service_slug}"
  }',
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
  'Standard sitemap template for plumbing and drain cleaning companies. Includes emergency services and scheduled maintenance pages.',
  '{
    "pages": [
      {
        "id": "home",
        "title": "Home",
        "url_pattern": "/",
        "children": []
      },
      {
        "id": "about",
        "title": "About Us",
        "url_pattern": "/about",
        "children": []
      },
      {
        "id": "services",
        "title": "Services",
        "url_pattern": "/services",
        "children": [
          {
            "id": "drain-cleaning",
            "title": "Drain Cleaning",
            "url_pattern": "/drain-cleaning",
            "is_service": true
          },
          {
            "id": "water-heater",
            "title": "Water Heater Services",
            "url_pattern": "/water-heater",
            "is_service": true
          },
          {
            "id": "leak-repair",
            "title": "Leak Repair",
            "url_pattern": "/leak-repair",
            "is_service": true
          },
          {
            "id": "pipe-repair",
            "title": "Pipe Repair & Replacement",
            "url_pattern": "/pipe-repair",
            "is_service": true
          },
          {
            "id": "emergency-plumbing",
            "title": "Emergency Plumbing",
            "url_pattern": "/emergency-plumbing",
            "is_service": true
          }
        ]
      },
      {
        "id": "service-areas",
        "title": "Service Areas",
        "url_pattern": "/service-areas",
        "is_location_parent": true,
        "children": []
      },
      {
        "id": "contact",
        "title": "Contact Us",
        "url_pattern": "/contact",
        "children": []
      }
    ]
  }',
  '[
    {"id": "drain-cleaning", "name": "Drain Cleaning", "url_slug": "drain-cleaning", "category": "drains"},
    {"id": "water-heater", "name": "Water Heater Services", "url_slug": "water-heater", "category": "water-heater"},
    {"id": "leak-repair", "name": "Leak Repair", "url_slug": "leak-repair", "category": "repair"},
    {"id": "pipe-repair", "name": "Pipe Repair & Replacement", "url_slug": "pipe-repair", "category": "repair"},
    {"id": "emergency-plumbing", "name": "Emergency Plumbing", "url_slug": "emergency-plumbing", "category": "emergency"},
    {"id": "sewer-line", "name": "Sewer Line Services", "url_slug": "sewer-line", "category": "drains"},
    {"id": "fixture-installation", "name": "Fixture Installation", "url_slug": "fixture-installation", "category": "installation"}
  ]',
  '{
    "service": "/{service_slug}",
    "location": "/service-areas/{location_slug}",
    "service_location": "/{location_slug}-{service_slug}"
  }',
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
