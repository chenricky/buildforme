'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import type { Project } from '@/lib/types';
import {
  Search,
  Ruler,
  DollarSign,
  Clock,
  ArrowRight,
  Sparkles,
  PlusCircle,
  Hammer,
  Filter,
} from 'lucide-react';

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function ProjectCard({
  project,
  bidCount,
}: {
  project: Project;
  bidCount: number;
}) {
  const statusStyles: Record<Project['status'], string> = {
    open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const statusLabel: Record<Project['status'], string> = {
    open: 'Open for bids',
    in_progress: 'In progress',
    completed: 'Completed',
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyles[project.status]}`}
          >
            {statusLabel[project.status]}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-stone-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-stone-900 mb-2 line-clamp-1 group-hover:text-amber-800 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-stone-600 line-clamp-2 mb-4 flex-1">
          {project.description}
        </p>

        <div className="space-y-2 mb-4 pt-4 border-t border-stone-100">
          <div className="flex items-center text-xs text-stone-500">
            <Ruler className="h-3.5 w-3.5 mr-2 text-amber-700" />
            <span className="truncate">{project.dimensions}</span>
          </div>
          <div className="flex items-center text-xs text-stone-500">
            <DollarSign className="h-3.5 w-3.5 mr-2 text-amber-700" />
            <span className="font-semibold text-stone-800">
              ${project.priceMin.toLocaleString()} – ${project.priceMax.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center text-xs text-stone-500">
            <Clock className="h-3.5 w-3.5 mr-2 text-amber-700" />
            <span>{formatRelativeTime(project.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-amber-800 font-semibold text-sm">
          <span>View details</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

type StatusFilter = 'all' | Project['status'];

export default function MarketplaceFeed({
  projects,
  bidCounts,
}: {
  projects: Project[];
  bidCounts: Record<string, number>;
}) {
  const { currentUserRole } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchQuery, statusFilter]);

  const openCount = projects.filter(p => p.status === 'open').length;
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  const filterButtons: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'open', label: 'Open', count: openCount },
    { value: 'in_progress', label: 'In Progress', count: inProgressCount },
    { value: 'completed', label: 'Completed', count: completedCount },
    { value: 'all', label: 'All', count: projects.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="h-5 w-5 text-amber-700" />
          <span className="text-sm font-semibold text-amber-700 uppercase tracking-wider">
            {currentUserRole === 'artisan' ? 'Find Your Next Commission' : 'Marketplace'}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight mb-2">
              {currentUserRole === 'artisan'
                ? 'Browse Open Projects'
                : 'Custom Furniture, Built to Order'}
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl">
              {currentUserRole === 'artisan'
                ? 'Discover unique woodworking requests from customers around the world. Submit your bid and bring their vision to life.'
                : 'Connect with skilled artisans who craft one-of-a-kind pieces tailored to your space, style, and budget.'}
            </p>
          </div>
          {currentUserRole === 'customer' && (
            <Link
              href="/projects/new"
              className="inline-flex items-center space-x-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Post a Project</span>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 md:p-5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search projects by title or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-stone-400 flex-shrink-0" />
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === btn.value
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{btn.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === btn.value
                      ? 'bg-amber-700 text-amber-50'
                      : 'bg-white text-stone-500'
                  }`}
                >
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-16 text-center">
          <Hammer className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            No projects found
          </h3>
          <p className="text-stone-500 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters.'
              : currentUserRole === 'customer'
              ? 'Be the first to post a custom furniture project.'
              : 'Check back soon for new opportunities.'}
          </p>
          {currentUserRole === 'customer' && !searchQuery && (
            <Link
              href="/projects/new"
              className="inline-flex items-center space-x-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold px-5 py-2.5 rounded-xl"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post Your First Project</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              bidCount={bidCounts[project.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
