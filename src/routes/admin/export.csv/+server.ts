import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentGame } from '#lib/server/game.js';
import { decisionsCsv } from '#lib/server/export.js';

/** /admin/export.csv exports the current game; ?game=<id> exports an earlier one. */
export const GET: RequestHandler = ({ url }) => {
	const param = url.searchParams.get('game');
	const gameId = param ? Number(param) : getCurrentGame().id;
	if (!Number.isInteger(gameId) || gameId < 1) error(400, 'Invalid game id');
	return new Response(decisionsCsv(gameId), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="startup-journey-game-${gameId}.csv"`
		}
	});
};
