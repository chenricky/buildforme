'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export type { UserRole, ProjectStatus, BidStatus, Project, Bid } from '@/lib/types';
import type { UserRole } from '@/lib/types';

// ============================================================================
// Lightweight client-side context: ONLY tracks the active UI role.
//
// All project + bid data now lives in Neon Postgres and is read/written via
// Server Actions in `src/lib/actions.ts`. The role toggle stays in
// localStorage so the demo can switch perspectives without auth.
// ============================================================================

const ROLE_STORAGE_KEY = 'buildforme_active_role';

export interface AppContextType {
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  toggleUserRole: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUserRole, setRole] = useState<UserRole>('customer');

  // Hydrate role from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY);
      if (stored === 'customer' || stored === 'artisan') {
        setRole(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrentUserRole = useCallback((role: UserRole) => {
    setRole(role);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleUserRole = useCallback(() => {
    setRole(prev => {
      const next: UserRole = prev === 'customer' ? 'artisan' : 'customer';
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ currentUserRole, setCurrentUserRole, toggleUserRole }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
