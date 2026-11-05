import type { Handle } from '@sveltejs/kit/hooks';
import { runMigrations } from '#lib/server/db/index.js';
import { getContent } from '#lib/server/content.js';
import { syncStations } from '#lib/server/stations.js';
import { getTeam } from '#lib/server/teams.js';
import { TEAM_COOKIE, clearTeamCookie } from '#lib/server/auth.js';
import { adminChallenge, isAdminAuthorized } from '#lib/server/admin.js';

// Runs once when the server starts: validate content, migrate the database, create station tokens.
getContent();
runMigrations();
syncStations();

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin') && !isAdminAuthorized(event.request.headers.get('authorization'))) {
		return adminChallenge();
	}
	const id = event.cookies.get(TEAM_COOKIE);
	event.locals.team = id ? getTeam(id) : undefined;
	if (id && !event.locals.team) clearTeamCookie(event.cookies);
	return resolve(event);
};
