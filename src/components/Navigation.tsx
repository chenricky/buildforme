'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Hammer, User, PlusCircle, LayoutGrid } from 'lucide-react';

export default function Navigation() {
  const { currentUserRole, toggleUserRole } = useApp();

  return (
    <nav className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-amber-100 p-2 rounded-lg group-hover:bg-amber-200 transition-colors">
                <Hammer className="h-6 w-6 text-amber-800" />
              </div>
              <span className="text-xl font-bold text-amber-50 tracking-tight">
                BuildForMe
              </span>
            </Link>
            <span className="hidden sm:inline-block text-amber-200 text-sm ml-4 px-3 py-1 bg-amber-700/50 rounded-full">
              Custom Furniture Marketplace
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-1 text-amber-100 hover:text-white transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium">Browse Projects</span>
            </Link>

            {currentUserRole === 'customer' && (
              <Link
                href="/projects/new"
                className="flex items-center space-x-1 text-amber-100 hover:text-white transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Post Project</span>
              </Link>
            )}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-amber-700/50 rounded-xl p-1.5">
              <button
                onClick={() => currentUserRole !== 'customer' && toggleUserRole()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentUserRole === 'customer'
                    ? 'bg-amber-100 text-amber-800 shadow-md font-semibold'
                    : 'text-amber-200 hover:text-white hover:bg-amber-600/50'
                }`}
                aria-label="Switch to Customer role"
                aria-pressed={currentUserRole === 'customer'}
              >
                <User className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Customer</span>
              </button>

              <button
                onClick={() => currentUserRole !== 'artisan' && toggleUserRole()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentUserRole === 'artisan'
                    ? 'bg-amber-100 text-amber-800 shadow-md font-semibold'
                    : 'text-amber-200 hover:text-white hover:bg-amber-600/50'
                }`}
                aria-label="Switch to Artisan role"
                aria-pressed={currentUserRole === 'artisan'}
              >
                <Hammer className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Artisan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-amber-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-1 text-amber-100 hover:text-white text-sm"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Browse</span>
          </Link>

          {currentUserRole === 'customer' && (
            <Link
              href="/projects/new"
              className="flex items-center space-x-1 text-amber-100 hover:text-white text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
