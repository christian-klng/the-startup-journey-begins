import { timingSafeEqual } from 'node:crypto';
import { ADMIN_PASSWORD } from '$app/env/private';

/** Basic auth for /admin. Any user name works; only the password counts. */
export function isAdminAuthorized(header: string | null): boolean {
	if (!header?.startsWith('Basic ')) return false;
	const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
	const password = decoded.slice(decoded.indexOf(':') + 1);
	const a = Buffer.from(password);
	const b = Buffer.from(ADMIN_PASSWORD);
	return a.length === b.length && timingSafeEqual(a, b);
}

export const adminChallenge = () =>
	new Response('Authentication required', {
		status: 401,
		headers: { 'www-authenticate': 'Basic realm="The Startup Journey Begins admin", charset="UTF-8"' }
	});
