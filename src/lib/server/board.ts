import { eq, inArray } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { getContent } from './content.js';
import { getCurrentGame } from './game.js';

export interface BoardTeam {
	id: string;
	name: string;
	members: string;
	topic: string;
	done: number;
	traps: number;
	completed: boolean;
	lastStation: string | null;
	/** Ordered decisions for the conclusion slide. */
	decisions: { station: string; choice: string; wasTrap: boolean; own: boolean }[];
}

export interface Board {
	total: number;
	teams: BoardTeam[];
	trapsTotal: number;
	decisionsTotal: number;
}

/** Snapshot of every team in the current game, for the live board and the conclusion. */
export function getBoard(): Board {
	const content = getContent();
	const game = getCurrentGame();
	const teams = db.select().from(schema.teams).where(eq(schema.teams.gameId, game.id)).orderBy(schema.teams.createdAt).all();
	if (!teams.length) return { total: content.stations.length, teams: [], trapsTotal: 0, decisionsTotal: 0 };

	const ids = teams.map((t) => t.id);
	const decisions = db
		.select({
			teamId: schema.decisions.teamId,
			stationId: schema.decisions.stationId,
			optionIndex: schema.decisions.optionIndex,
			ownText: schema.decisions.ownText,
			wasTrap: schema.decisions.wasTrap,
			createdAt: schema.decisions.createdAt,
			optionsJson: schema.generations.optionsJson
		})
		.from(schema.decisions)
		.leftJoin(schema.generations, eq(schema.decisions.generationId, schema.generations.id))
		.where(inArray(schema.decisions.teamId, ids))
		.orderBy(schema.decisions.createdAt)
		.all();

	const stationTitle = (id: string) => content.stations.find((s) => s.id === id)?.title ?? id;

	const boardTeams = teams.map((t) => {
		const mine = decisions.filter((d) => d.teamId === t.id);
		return {
			id: t.id,
			name: t.name,
			members: t.members,
			topic: content.topics.find((x) => x.id === t.topicId)?.title ?? t.topicId,
			done: mine.length,
			traps: mine.filter((d) => d.wasTrap).length,
			completed: mine.length >= content.stations.length,
			lastStation: mine.length ? stationTitle(mine[mine.length - 1].stationId) : null,
			decisions: mine.map((d) => {
				let choice = d.ownText ?? '';
				if (d.optionIndex !== null && d.optionsJson) {
					choice = (JSON.parse(d.optionsJson) as { title: string }[])[d.optionIndex]?.title ?? choice;
				}
				return { station: stationTitle(d.stationId), choice, wasTrap: d.wasTrap, own: d.optionIndex === null };
			})
		};
	});

	return {
		total: content.stations.length,
		teams: boardTeams,
		trapsTotal: boardTeams.reduce((n, t) => n + t.traps, 0),
		decisionsTotal: decisions.length
	};
}
