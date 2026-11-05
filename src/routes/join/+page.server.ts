import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getContent } from '#lib/server/content.js';
import { createTeam, TeamError } from '#lib/server/teams.js';
import { setTeamCookie } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.team) redirect(303, '/me');
	const { topics, strings } = getContent();
	return { topics, strings };
};

const clean = (v: FormDataEntryValue | null, max: number) =>
	String(v ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, max);

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const name = clean(form.get('name'), 60);
		const members = clean(form.get('members'), 120);
		const topicId = clean(form.get('topic'), 40);
		const values = { name, members, topicId };

		if (name.length < 2) return fail(400, { error: 'name', values });
		if (members.length < 2) return fail(400, { error: 'members', values });
		if (!topicId) return fail(400, { error: 'topic', values });

		try {
			const team = createTeam(values);
			setTeamCookie(cookies, team.id);
		} catch (e) {
			if (e instanceof TeamError) return fail(e.code === 'full' ? 503 : 400, { error: e.code, values });
			throw e;
		}
		redirect(303, '/me');
	}
};
