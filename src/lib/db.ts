import { neon } from '@neondatabase/serverless';

let sqlInstance: any = null;

function getSql(): any {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Return a stub function during build time if environment variables are not set.
      return () => Promise.resolve([]);
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

// Lazy SQL tagged template runner
export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  const runner = getSql();
  return runner(strings, ...values);
};

// Memoized schema initialization — runs once per server instance.
let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Gracefully resolve during static pre-rendering build phases
    return Promise.resolve();
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          dimensions TEXT NOT NULL,
          price_min NUMERIC NOT NULL,
          price_max NUMERIC NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          customer_id TEXT NOT NULL,
          image TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS bids (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          artisan_id TEXT NOT NULL,
          artisan_name TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          days INTEGER NOT NULL,
          proposal TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`;

      // Seed two starter projects on first run if the table is empty.
      const rows = (await sql`SELECT COUNT(*)::int AS count FROM projects`) as Array<{
        count: number;
      }>;
      const count = rows[0]?.count ?? 0;
      if (count === 0) {
        const oakImage =
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Q0YTVhNSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM1YzNlM2UiPk9hayBEaW5pbmcgVGFibGU8L3RleHQ+PC9zdmc+';
        const walnutImage =
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzhkNmU1ZSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiPldhbG51dCBCb29rc2hlbGY8L3RleHQ+PC9zdmc+';
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 86400000 * 2).toISOString();
        const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
        await sql`
          INSERT INTO projects (id, title, description, dimensions, price_min, price_max, status, customer_id, image, created_at)
          VALUES (
            'proj_seed_1',
            'Custom Oak Dining Table',
            'Looking for a skilled artisan to create a solid oak dining table that seats 6-8 people. I want a live-edge design with natural grain patterns visible. The table should have a clear protective finish and sturdy metal hairpin legs.',
            '180cm x 90cm x 75cm (L x W x H)',
            800, 1500, 'open', 'customer_1', ${oakImage}, ${twoDaysAgo}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`
          INSERT INTO projects (id, title, description, dimensions, price_min, price_max, status, customer_id, image, created_at)
          VALUES (
            'proj_seed_2',
            'Walnut Bookshelf - Mid-Century Modern',
            'I need a beautiful walnut bookshelf in mid-century modern style. Should have 5 shelves with adjustable heights. The wood should be finished with Danish oil to enhance the natural grain. Clean lines and tapered legs are essential.',
            '120cm x 35cm x 180cm (W x D x H)',
            600, 1200, 'open', 'customer_2', ${walnutImage}, ${oneDayAgo}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })().catch(err => {
      // Reset on failure so the next call can retry.
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}
