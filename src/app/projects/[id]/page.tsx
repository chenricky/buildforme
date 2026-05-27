import React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getProjectById, getBidsByProjectId } from '@/lib/actions';
import ProjectDetailClient from '@/components/ProjectDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage(props: PageProps) {
  const { id } = await props.params;

  const [project, bids] = await Promise.all([
    getProjectById(id),
    getBidsByProjectId(id),
  ]);

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-stone-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Project Not Found
          </h2>
          <p className="text-stone-600 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProjectDetailClient initialProject={project} initialBids={bids} />;
}
