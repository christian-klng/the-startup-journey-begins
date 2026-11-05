import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getContent } from '#lib/server/content.js';
import { getTeamProgress } from '#lib/server/teams.js';

export const load: PageServerLoad = ({ locals }) => {
	const team = locals.team;
	if (!team) redirect(303, '/join');
	const { topics, strings } = getContent();
	const topic = topics.find((t) => t.id === team.topicId);
	return {
		strings,
		team: { name: team.name, members: team.members, topic: topic?.title ?? team.topicId },
		progress: getTeamProgress(team)
	};
};
