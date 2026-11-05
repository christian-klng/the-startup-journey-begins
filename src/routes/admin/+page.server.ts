import { count, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { getCurrentGame } from '#lib/server/game.js';
import { isMockMode } from '#lib/server/llm.js';
import { SCALEWAY_MODEL } from '$app/env/private';
import { PUBLIC_BASE_URL } from '$app/env/public';

export const load: PageServerLoad = () => {
	const game = getCurrentGame();
	const { n } = db.select({ n: count() }).from(schema.teams).where(eq(schema.teams.gameId, game.id)).get()!;
	return { game: { id: game.id, startedAt: game.startedAt, teams: n }, llm: isMockMode() ? 'mock (no API key)' : SCALEWAY_MODEL, baseUrl: PUBLIC_BASE_URL };
};
