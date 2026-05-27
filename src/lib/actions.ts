'use server';

import { revalidatePath } from 'next/cache';
import { sql, ensureSchema } from './db';
import type {
  Bid,
  BidStatus,
  Project,
  ProjectStatus,
} from './types';

// ============================================================================
// Helpers
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  price_min: string | number;
  price_max: string | number;
  status: ProjectStatus;
  customer_id: string;
  image: string;
  created_at: string | Date;
}

interface BidRow {
  id: string;
  project_id: string;
  artisan_id: string;
  artisan_name: string;
  amount: string | number;
  days: number;
  proposal: string;
  status: BidStatus;
  created_at: string | Date;
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dimensions: row.dimensions,
    priceMin: Number(row.price_min),
    priceMax: Number(row.price_max),
    status: row.status,
    customerId: row.customer_id,
    image: row.image,
    createdAt: toIso(row.created_at),
  };
}

function mapBid(row: BidRow): Bid {
  return {
    id: row.id,
    projectId: row.project_id,
    artisanId: row.artisan_id,
    artisanName: row.artisan_name,
    amount: Number(row.amount),
    days: row.days,
    proposal: row.proposal,
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

// ============================================================================
// Queries
// ============================================================================

export async function getAllProjects(): Promise<Project[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM projects ORDER BY created_at DESC
  `) as ProjectRow[];
  return rows.map(mapProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM projects WHERE id = ${id} LIMIT 1
  `) as ProjectRow[];
  if (rows.length === 0) return null;
  return mapProject(rows[0]);
}

export async function getAllBids(): Promise<Bid[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM bids ORDER BY created_at DESC
  `) as BidRow[];
  return rows.map(mapBid);
}

export async function getBidsByProjectId(projectId: string): Promise<Bid[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM bids WHERE project_id = ${projectId} ORDER BY created_at DESC
  `) as BidRow[];
  return rows.map(mapBid);
}

// ============================================================================
// Mutations
// ============================================================================

export interface CreateProjectInput {
  title: string;
  description: string;
  dimensions: string;
  priceMin: number;
  priceMax: number;
  customerId: string;
  image: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  await ensureSchema();

  const title = input.title.trim();
  const description = input.description.trim();
  const dimensions = input.dimensions.trim();
  const customerId = input.customerId.trim() || 'customer_self';
  const image = input.image;

  if (title.length < 5) throw new Error('Title must be at least 5 characters.');
  if (description.length < 20)
    throw new Error('Description must be at least 20 characters.');
  if (!dimensions) throw new Error('Dimensions are required.');
  if (!Number.isFinite(input.priceMin) || input.priceMin < 0)
    throw new Error('Invalid minimum price.');
  if (!Number.isFinite(input.priceMax) || input.priceMax < 0)
    throw new Error('Invalid maximum price.');
  if (input.priceMax < input.priceMin)
    throw new Error('Maximum price must be greater than or equal to minimum.');
  if (!image) throw new Error('A reference image is required.');

  const id = generateId('proj');
  const rows = (await sql`
    INSERT INTO projects (
      id, title, description, dimensions, price_min, price_max,
      status, customer_id, image, created_at
    )
    VALUES (
      ${id}, ${title}, ${description}, ${dimensions},
      ${input.priceMin}, ${input.priceMax},
      'open', ${customerId}, ${image}, NOW()
    )
    RETURNING *
  `) as ProjectRow[];

  revalidatePath('/');
  revalidatePath(`/projects/${id}`);
  return mapProject(rows[0]);
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE projects SET status = ${status} WHERE id = ${projectId}
  `;
  revalidatePath('/');
  revalidatePath(`/projects/${projectId}`);
}

export interface CreateBidInput {
  projectId: string;
  artisanId: string;
  artisanName: string;
  amount: number;
  days: number;
  proposal: string;
}

export async function createBid(input: CreateBidInput): Promise<Bid> {
  await ensureSchema();

  const artisanId = input.artisanId.trim() || 'artisan_self';
  const artisanName = input.artisanName.trim();
  const proposal = input.proposal.trim();

  if (!input.projectId) throw new Error('Project id is required.');
  if (artisanName.length < 2)
    throw new Error('Artisan name must be at least 2 characters.');
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    throw new Error('Bid amount must be a positive number.');
  if (!Number.isInteger(input.days) || input.days <= 0)
    throw new Error('Days to complete must be a positive integer.');
  if (proposal.length < 20)
    throw new Error('Proposal must be at least 20 characters.');

  // Ensure project exists and is open
  const projectRows = (await sql`
    SELECT status FROM projects WHERE id = ${input.projectId} LIMIT 1
  `) as Array<{ status: ProjectStatus }>;
  if (projectRows.length === 0) throw new Error('Project not found.');
  if (projectRows[0].status !== 'open')
    throw new Error('This project is no longer accepting bids.');

  const id = generateId('bid');
  const rows = (await sql`
    INSERT INTO bids (
      id, project_id, artisan_id, artisan_name,
      amount, days, proposal, status, created_at
    )
    VALUES (
      ${id}, ${input.projectId}, ${artisanId}, ${artisanName},
      ${input.amount}, ${input.days}, ${proposal}, 'pending', NOW()
    )
    RETURNING *
  `) as BidRow[];

  revalidatePath('/');
  revalidatePath(`/projects/${input.projectId}`);
  return mapBid(rows[0]);
}

export async function acceptBid(bidId: string): Promise<void> {
  await ensureSchema();

  const targetRows = (await sql`
    SELECT project_id FROM bids WHERE id = ${bidId} LIMIT 1
  `) as Array<{ project_id: string }>;
  if (targetRows.length === 0) throw new Error('Bid not found.');
  const projectId = targetRows[0].project_id;

  // Accept the chosen bid
  await sql`UPDATE bids SET status = 'accepted' WHERE id = ${bidId}`;

  // Reject all other pending bids on the same project
  await sql`
    UPDATE bids
    SET status = 'rejected'
    WHERE project_id = ${projectId} AND id <> ${bidId} AND status = 'pending'
  `;

  // Move the project to in_progress
  await sql`
    UPDATE projects SET status = 'in_progress' WHERE id = ${projectId}
  `;

  revalidatePath('/');
  revalidatePath(`/projects/${projectId}`);
}

export async function rejectBid(bidId: string): Promise<void> {
  await ensureSchema();

  const rows = (await sql`
    UPDATE bids SET status = 'rejected' WHERE id = ${bidId}
    RETURNING project_id
  `) as Array<{ project_id: string }>;

  if (rows[0]) {
    revalidatePath(`/projects/${rows[0].project_id}`);
  }
  revalidatePath('/');
}
