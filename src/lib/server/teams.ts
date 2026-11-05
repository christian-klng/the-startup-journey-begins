import { randomBytes } from 'node:crypto';
import { and, count, eq } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { getContent } from './content.js';
import { getCurrentGame } from './game.js';
import { MAX_TEAMS } from '$app/env/private';
import { emitGameEvent } from './events.js';

export type Team = typeof schema.teams.$inferSelect;

export class TeamError extends Error {
	constructor(
		public code: 'full' | 'invalid_topic',
		message: string
	) {
		super(message);
	}
}

export function createTeam(input: { name: string; members: string; topicId: string }): Team {
	const game = getCurrentGame();
	if (!getContent().topics.some((t) => t.id === input.topicId)) {
		throw new TeamError('invalid_topic', 'Unknown topic');
	}
	const { n } = db
		.select({ n: count() })
		.from(schema.teams)
		.where(eq(schema.teams.gameId, game.id))
		.get()!;
	if (n >= MAX_TEAMS) throw new TeamError('full', 'Maximum number of teams reached');

	const team = db
		.insert(schema.teams)
		.values({
			id: randomBytes(12).toString('base64url'),
			gameId: game.id,
			name: input.name,
			members: input.members,
			topicId: input.topicId
		})
		.returning()
		.get();
	emitGameEvent({ type: 'team_joined' });
	return team;
}

/** Returns the team only if it belongs to the current game; stale cookies from an earlier game are ignored. */
export function getTeam(id: string): Team | undefined {
	const game = getCurrentGame();
	return db
		.select()
		.from(schema.teams)
		.where(and(eq(schema.teams.id, id), eq(schema.teams.gameId, game.id)))
		.get();
}

export interface TeamProgress {
	done: number;
	total: number;
	decisions: {
		stationId: string;
		title: string;
		question: string;
		choice: string;
		wasTrap: boolean;
		createdAt: number;
	}[];
}

export function getTeamProgress(team: Team): TeamProgress {
	const content = getContent();
	const rows = db
		.select({
			stationId: schema.decisions.stationId,
			optionIndex: schema.decisions.optionIndex,
			ownText: schema.decisions.ownText,
			wasTrap: schema.decisions.wasTrap,
			createdAt: schema.decisions.createdAt,
			optionsJson: schema.generations.optionsJson
		})
		.from(schema.decisions)
		.leftJoin(schema.generations, eq(schema.decisions.generationId, schema.generations.id))
		.where(eq(schema.decisions.teamId, team.id))
		.orderBy(schema.decisions.createdAt)
		.all();

	const decisions = rows.flatMap((r) => {
		const station = content.stations.find((s) => s.id === r.stationId);
		if (!station) return [];
		let choice = r.ownText ?? '';
		if (r.optionIndex !== null && r.optionsJson) {
			const options = JSON.parse(r.optionsJson) as { title: string }[];
			choice = options[r.optionIndex]?.title ?? choice;
		}
		return [
			{
				stationId: r.stationId,
				title: station.title,
				question: station.question,
				choice,
				wasTrap: r.wasTrap,
				createdAt: r.createdAt
			}
		];
	});

	return { done: decisions.length, total: content.stations.length, decisions };
}
