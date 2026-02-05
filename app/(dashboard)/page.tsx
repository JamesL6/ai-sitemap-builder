import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, FolderKanban, FileText } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to AI Sitemap Builder. Create and manage your website sitemaps.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              Create and manage your sitemap projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Browse and manage sitemap templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/templates">
                View Templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to create your first sitemap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Choose a template</h3>
              <p className="text-sm text-gray-600">
                Select a pre-built template or start from scratch
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Crawl client website</h3>
              <p className="text-sm text-gray-600">
                Enter a website URL to automatically import its structure
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI-powered comparison</h3>
              <p className="text-sm text-gray-600">
                Let AI match template pages with client pages automatically
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              4
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Export sitemap</h3>
              <p className="text-sm text-gray-600">
                Download your sitemap as CSV or JSON for use in proposals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
