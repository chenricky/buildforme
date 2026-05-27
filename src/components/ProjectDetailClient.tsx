'use client';

import React, { useState, useTransition, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Project, Bid } from '@/lib/types';
import { createBid, acceptBid } from '@/lib/actions';
import {
  ArrowLeft,
  Ruler,
  DollarSign,
  Clock,
  Hammer,
  User,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  Inbox,
  Loader2,
  ShieldCheck,
  Sparkles,
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

const STATUS_STYLES: Record<Project['status'], string> = {
  open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-stone-200 text-stone-700 border-stone-300',
};

const STATUS_LABEL: Record<Project['status'], string> = {
  open: 'Open for bids',
  in_progress: 'In progress',
  completed: 'Completed',
};

const BID_STATUS_STYLES: Record<Bid['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-stone-200 text-stone-600 border-stone-300',
};

interface BidFormProps {
  projectId: string;
  priceMin: number;
  priceMax: number;
  onBidAdded: (newBid: Bid) => void;
}

function BidForm({ projectId, priceMin, priceMax, onBidAdded }: BidFormProps) {
  const [artisanName, setArtisanName] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const [proposal, setProposal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!artisanName.trim()) e.artisanName = 'Please enter your name.';
    else if (artisanName.trim().length < 2)
      e.artisanName = 'Name must be at least 2 characters.';

    const amt = parseFloat(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0)
      e.amount = 'Enter a valid bid amount.';

    const d = parseInt(days, 10);
    if (!days.trim() || isNaN(d) || d <= 0)
      e.days = 'Enter a valid number of days.';

    if (!proposal.trim()) e.proposal = 'Please describe your approach.';
    else if (proposal.trim().length < 20)
      e.proposal = 'Proposal should be at least 20 characters.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        const res = await createBid({
          projectId,
          artisanId: 'artisan_self',
          artisanName: artisanName.trim(),
          amount: parseFloat(amount),
          days: parseInt(days, 10),
          proposal: proposal.trim(),
        });
        if (!res.success || !res.data) {
          setErrors({ global: res.error ?? 'Failed to submit bid.' });
        } else {
          onBidAdded(res.data);
        }
      } catch (err) {
        console.error(err);
        setErrors({ global: 'Something went wrong. Please try again.' });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5"
    >
      <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
        <Send className="h-5 w-5 text-amber-700" />
        <h2 className="text-xl font-bold text-stone-900">Submit Your Bid</h2>
      </div>

      <p className="text-sm text-stone-600">
        The customer's budget range is{' '}
        <span className="font-semibold text-stone-900">
          ${priceMin.toLocaleString()} – ${priceMax.toLocaleString()}
        </span>
        . Submit a competitive offer.
      </p>

      {errors.global && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 flex items-start space-x-2 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errors.global}</span>
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="artisanName"
          className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
        >
          <User className="h-4 w-4 text-amber-700" />
          <span>Your Name *</span>
        </label>
        <input
          id="artisanName"
          type="text"
          value={artisanName}
          onChange={e => setArtisanName(e.target.value)}
          placeholder="e.g. Jane Carpenter"
          maxLength={80}
          className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
            errors.artisanName ? 'border-red-300' : 'border-stone-200'
          }`}
        />
        {errors.artisanName && (
          <p className="mt-1.5 text-sm text-red-700">{errors.artisanName}</p>
        )}
      </div>

      {/* Amount + Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="amount"
            className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
          >
            <DollarSign className="h-4 w-4 text-amber-700" />
            <span>Bid Amount (USD) *</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
              $
            </span>
            <input
              id="amount"
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className={`w-full pl-7 pr-3 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
                errors.amount ? 'border-red-300' : 'border-stone-200'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1.5 text-xs text-red-700">{errors.amount}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="days"
            className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
          >
            <Calendar className="h-4 w-4 text-amber-700" />
            <span>Days to Complete *</span>
          </label>
          <input
            id="days"
            type="number"
            min="1"
            step="1"
            value={days}
            onChange={e => setDays(e.target.value)}
            placeholder="e.g. 21"
            className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
              errors.days ? 'border-red-300' : 'border-stone-200'
            }`}
          />
          {errors.days && (
            <p className="mt-1.5 text-xs text-red-700">{errors.days}</p>
          )}
        </div>
      </div>

      {/* Proposal */}
      <div>
        <label
          htmlFor="proposal"
          className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
        >
          <FileText className="h-4 w-4 text-amber-700" />
          <span>Your Proposal *</span>
        </label>
        <textarea
          id="proposal"
          rows={5}
          value={proposal}
          onChange={e => setProposal(e.target.value)}
          placeholder="Describe your approach, materials you'll use, your relevant experience, and why you're a great fit for this project..."
          maxLength={2000}
          className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-y ${
            errors.proposal ? 'border-red-300' : 'border-stone-200'
          }`}
        />
        <div className="mt-1 flex justify-between items-center">
          {errors.proposal ? (
            <p className="text-sm text-red-700">{errors.proposal}</p>
          ) : (
            <span className="text-xs text-stone-400">
              A thoughtful proposal increases your chances of winning.
            </span>
          )}
          <span className="text-xs text-stone-400">
            {proposal.length}/2000
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center space-x-2 bg-amber-800 hover:bg-amber-900 disabled:bg-amber-800/60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting bid...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Submit Bid</span>
          </>
        )}
      </button>
    </form>
  );
}

function BidCard({
  bid,
  canAccept,
  onAccept,
  isAccepting,
}: {
  bid: Bid;
  canAccept: boolean;
  onAccept: (bidId: string) => void;
  isAccepting: boolean;
}) {
  const statusIcon =
    bid.status === 'accepted' ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : bid.status === 'rejected' ? (
      <XCircle className="h-3.5 w-3.5" />
    ) : (
      <Clock className="h-3.5 w-3.5" />
    );

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        bid.status === 'accepted'
          ? 'border-emerald-300 bg-emerald-50/40'
          : bid.status === 'rejected'
          ? 'border-stone-200 bg-stone-50/40 opacity-75'
          : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <User className="h-4 w-4 text-amber-800" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">{bid.artisanName}</p>
            <p className="text-xs text-stone-500">
              {formatRelativeTime(bid.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${BID_STATUS_STYLES[bid.status]}`}
        >
          {statusIcon}
          <span className="capitalize">{bid.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-stone-100">
        <div>
          <p className="text-xs text-stone-500 mb-0.5">Bid Amount</p>
          <p className="text-lg font-bold text-stone-900">
            ${bid.amount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500 mb-0.5">Timeline</p>
          <p className="text-lg font-bold text-stone-900">
            {bid.days} {bid.days === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
          Proposal
        </p>
        <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
          {bid.proposal}
        </p>
      </div>

      {canAccept && bid.status === 'pending' && (
        <button
          onClick={() => onAccept(bid.id)}
          disabled={isAccepting}
          className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/60 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          {isAccepting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Accepting...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Accept this Bid</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function ProjectDetailClient({
  initialProject,
  initialBids,
}: {
  initialProject: Project;
  initialBids: Bid[];
}) {
  const router = useRouter();
  const { currentUserRole } = useApp();
  const [project, setProject] = useState<Project>(initialProject);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [isAccepting, startAcceptTransition] = useTransition();

  const artisanExistingBid = useMemo(
    () => bids.find(b => b.artisanId === 'artisan_self'),
    [bids]
  );

  const handleBidAdded = (newBid: Bid) => {
    setBids(prev => [newBid, ...prev]);
    router.refresh();
  };

  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleAcceptBid = (bidId: string) => {
    setGlobalError(null);
    startAcceptTransition(async () => {
      try {
        const res = await acceptBid(bidId);
        if (!res.success) {
          setGlobalError(res.error ?? 'Failed to accept bid.');
          return;
        }
        // Snappy local state updates
        setBids(prev =>
          prev.map(b => {
            if (b.id === bidId) return { ...b, status: 'accepted' };
            if (b.status === 'pending') return { ...b, status: 'rejected' };
            return b;
          })
        );
        setProject(prev => ({ ...prev, status: 'in_progress' }));
        router.refresh();
      } catch (err) {
        console.error(err);
        setGlobalError('Something went wrong. Please try again.');
      }
    });
  };

  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      const order: Record<Bid['status'], number> = {
        pending: 0,
        accepted: 1,
        rejected: 2,
      };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [bids]);

  const pendingBidCount = bids.filter(b => b.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center space-x-1 text-stone-600 hover:text-amber-800 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Marketplace</span>
      </Link>

      {/* Global Error */}
      {globalError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{globalError}</p>
        </div>
      )}

      {/* Status Banner */}
      {project.status !== 'open' && (
        <div
          className={`mb-6 rounded-xl border p-4 flex items-start space-x-3 ${
            project.status === 'in_progress'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          {project.status === 'in_progress' ? (
            <Hammer className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              {project.status === 'in_progress'
                ? 'This project is in progress'
                : 'This project is complete'}
            </p>
            <p className="text-sm opacity-90 mt-0.5">
              {project.status === 'in_progress'
                ? 'An artisan has been selected and is working on this commission.'
                : 'This project has been delivered.'}
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_STYLES[project.status]}`}
            >
              {STATUS_LABEL[project.status]}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Custom Project
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight mb-3">
            {project.title}
          </h1>
          <p className="text-stone-600 text-base leading-relaxed whitespace-pre-wrap mb-6">
            {project.description}
          </p>

          {/* Spec grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-100">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                <Ruler className="h-4 w-4 text-amber-800" />
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Dimensions</p>
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {project.dimensions}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 text-amber-800" />
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Budget Range</p>
                <p className="text-sm font-semibold text-stone-900">
                  ${project.priceMin.toLocaleString()} – ${project.priceMax.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-800" />
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Posted</p>
                <p className="text-sm font-semibold text-stone-900">
                  {formatRelativeTime(project.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-aware section */}
      {currentUserRole === 'artisan' ? (
        // -------- ARTISAN VIEW --------
        <div className="space-y-6">
          {project.status !== 'open' ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
              <Hammer className="h-10 w-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-stone-900 mb-1">
                Bidding is closed
              </h3>
              <p className="text-sm text-stone-500">
                This project is no longer accepting new bids.
              </p>
            </div>
          ) : artisanExistingBid ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-stone-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-stone-900">
                  Your Bid Has Been Submitted
                </h2>
              </div>
              <BidCard
                bid={artisanExistingBid}
                canAccept={false}
                onAccept={() => {}}
                isAccepting={false}
              />
              <p className="text-xs text-stone-500 mt-4 text-center">
                The customer will review your bid and notify you of their
                decision.
              </p>
            </div>
          ) : (
            <BidForm
              projectId={project.id}
              priceMin={project.priceMin}
              priceMax={project.priceMax}
              onBidAdded={handleBidAdded}
            />
          )}
        </div>
      ) : (
        // -------- CUSTOMER VIEW --------
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Inbox className="h-5 w-5 text-amber-700" />
              <h2 className="text-2xl font-bold text-stone-900">
                Incoming Bids
              </h2>
              {bids.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {bids.length} total
                </span>
              )}
            </div>
            {pendingBidCount > 0 && project.status === 'open' && (
              <span className="text-sm text-stone-500">
                {pendingBidCount}{' '}
                {pendingBidCount === 1 ? 'awaiting' : 'awaiting'} your review
              </span>
            )}
          </div>

          {sortedBids.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center">
              <Inbox className="h-10 w-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-stone-900 mb-1">
                No bids yet
              </h3>
              <p className="text-sm text-stone-500">
                Sit tight — artisans are reviewing your project. Bids will
                appear here as they come in.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBids.map(bid => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  canAccept={project.status === 'open'}
                  onAccept={handleAcceptBid}
                  isAccepting={isAccepting}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


