import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getContent } from '#lib/server/content.js';
import { createTeam, TeamError } from '#lib/server/teams.js';
import { setTeamCookie } from '#lib/server/auth.js';

/** Only station paths may be used as a post-join redirect target. */
const safeNext = (value: string | null) => (value && /^\/s\/[A-Za-z0-9_-]+$/.test(value) ? value : '/me');

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.team) redirect(303, safeNext(url.searchParams.get('next')));
	const { topics, strings } = getContent();
	return { topics, strings, next: url.searchParams.get('next') ?? '' };
};

const clean = (v: FormDataEntryValue | null, max: number) =>
	String(v ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, max);

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const next = safeNext(String(form.get('next') ?? ''));
		const members = clean(form.get('members'), 120);
		const topicId = clean(form.get('topic'), 40);
		const values = { members, topicId };

		if (members.length < 2) return fail(400, { error: 'members', values });
		if (!topicId) return fail(400, { error: 'topic', values });

		try {
			const team = createTeam(values);
			setTeamCookie(cookies, team.id);
		} catch (e) {
			if (e instanceof TeamError) return fail(e.code === 'full' ? 503 : 400, { error: e.code, values });
			throw e;
		}
		redirect(303, next);
	}
};
