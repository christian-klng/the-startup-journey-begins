import type { Cookies } from '@sveltejs/kit';

export const TEAM_COOKIE = 'sj_team';
const ONE_DAY = 60 * 60 * 24;

export function setTeamCookie(cookies: Cookies, teamId: string) {
	cookies.set(TEAM_COOKIE, teamId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // deployment is plain HTTP by design
		maxAge: ONE_DAY
	});
}

export function clearTeamCookie(cookies: Cookies) {
	cookies.delete(TEAM_COOKIE, { path: '/' });
}
