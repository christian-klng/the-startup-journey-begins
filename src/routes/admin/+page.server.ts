import { fail } from '@sveltejs/kit';
import { count, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db, schema } from '#lib/server/db/index.js';
import { getCurrentGame, resetGame } from '#lib/server/game.js';
import { getBoard } from '#lib/server/board.js';
import { isMockMode } from '#lib/server/llm.js';
import { SCALEWAY_MODEL } from '$app/env/private';
import { PUBLIC_BASE_URL } from '$app/env/public';

export const load: PageServerLoad = () => {
	const game = getCurrentGame();
	const board = getBoard();
	const previous = db
		.select({ id: schema.games.id, startedAt: schema.games.startedAt, endedAt: schema.games.endedAt, teams: count(schema.teams.id) })
		.from(schema.games)
		.leftJoin(schema.teams, eq(schema.teams.gameId, schema.games.id))
		.groupBy(schema.games.id)
		.orderBy(desc(schema.games.id))
		.all()
		.filter((g) => g.id !== game.id);

	return {
		game: { id: game.id, startedAt: game.startedAt },
		board,
		previous,
		llm: isMockMode() ? 'mock (no API key configured)' : SCALEWAY_MODEL,
		baseUrl: PUBLIC_BASE_URL
	};
};

export const actions: Actions = {
	reset: async ({ request }) => {
		const form = await request.formData();
		if (form.get('confirm') !== 'on') return fail(400, { error: 'confirm' });
		resetGame();
		return { reset: true };
	}
};
