import { getAllProjects, getAllBids } from '@/lib/actions';
import MarketplaceFeed from '@/components/MarketplaceFeed';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, bids] = await Promise.all([getAllProjects(), getAllBids()]);

  // Bid counts per project (server-computed so client doesn't re-fetch)
  const bidCounts: Record<string, number> = {};
  for (const b of bids) {
    bidCounts[b.projectId] = (bidCounts[b.projectId] ?? 0) + 1;
  }

  return <MarketplaceFeed projects={projects} bidCounts={bidCounts} />;
}
