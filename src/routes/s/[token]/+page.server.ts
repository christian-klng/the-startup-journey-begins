import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getContent } from '#lib/server/content.js';
import {
	DecisionError,
	getDecision,
	getGeneration,
	getOrCreateGeneration,
	getStationByToken,
	parseOptions,
	recordDecision
} from '#lib/server/stations.js';
import { getTeamProgress } from '#lib/server/teams.js';

export const load: PageServerLoad = ({ params, locals, url }) => {
	const station = getStationByToken(params.token);
	if (!station) error(404, 'Unknown station');
	const team = locals.team;
	if (!team) redirect(303, `/join?next=${encodeURIComponent(url.pathname)}`);

	const { strings } = getContent();
	const base = {
		strings,
		station: { id: station.id, title: station.title, question: station.question, hint: station.hint, reveal: station.reveal },
		progress: (({ done, total }) => ({ done, total }))(getTeamProgress(team))
	};

	const decision = getDecision(team, station);
	if (decision) {
		const gen = getGeneration(team, station);
		const choice =
			decision.optionIndex !== null && gen ? parseOptions(gen)[decision.optionIndex] : { title: decision.ownText ?? '', text: '' };
		return { ...base, decided: { choice, wasTrap: decision.wasTrap, justNow: url.searchParams.has('done') } };
	}

	// Streamed: the page renders immediately and shows a spinner until the LLM answers.
	const options = getOrCreateGeneration(team, station).then(parseOptions);
	return { ...base, decided: null, options };
};

export const actions: Actions = {
	decide: async ({ params, locals, request }) => {
		const station = getStationByToken(params.token);
		if (!station) error(404, 'Unknown station');
		const team = locals.team;
		if (!team) redirect(303, '/join');

		const form = await request.formData();
		const raw = String(form.get('option') ?? '');
		const ownText = String(form.get('own') ?? '')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 400);
		const optionIndex = raw === 'own' ? null : Number(raw);

		try {
			recordDecision(team, station, { optionIndex: Number.isNaN(optionIndex) ? -1 : optionIndex, ownText: ownText || null });
		} catch (e) {
			if (e instanceof DecisionError) {
				if (e.code === 'already_decided') redirect(303, `/s/${params.token}`);
				return fail(400, { error: e.code, own: ownText });
			}
			throw e;
		}
		redirect(303, `/s/${params.token}?done`);
	}
};
