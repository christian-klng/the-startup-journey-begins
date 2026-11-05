import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';

export function GET() {
	db.get(sql`select 1`);
	return json({ ok: true });
}
