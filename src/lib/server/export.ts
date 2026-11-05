import { eq } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { getContent } from './content.js';

const cell = (v: unknown) => {
	const s = v === null || v === undefined ? '' : String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const iso = (unix: number | null) => (unix ? new Date(unix * 1000).toISOString() : '');

/** One row per decision; teams without decisions get one row with empty station columns. */
export function decisionsCsv(gameId: number): string {
	const content = getContent();
	const teams = db.select().from(schema.teams).where(eq(schema.teams.gameId, gameId)).orderBy(schema.teams.createdAt).all();
	const rows = db
		.select({
			teamId: schema.decisions.teamId,
			stationId: schema.decisions.stationId,
			optionIndex: schema.decisions.optionIndex,
			ownText: schema.decisions.ownText,
			wasTrap: schema.decisions.wasTrap,
			createdAt: schema.decisions.createdAt,
			optionsJson: schema.generations.optionsJson,
			trapIndex: schema.generations.trapIndex,
			model: schema.generations.model
		})
		.from(schema.decisions)
		.leftJoin(schema.generations, eq(schema.decisions.generationId, schema.generations.id))
		.orderBy(schema.decisions.createdAt)
		.all();

	const header = [
		'game', 'members', 'topic', 'joined_at', 'completed_at',
		'station', 'question', 'decided_at', 'kind', 'choice_title', 'choice_text', 'was_trap', 'trap_title', 'model'
	];
	const lines = [header.join(',')];

	for (const t of teams) {
		const topic = content.topics.find((x) => x.id === t.topicId)?.title ?? t.topicId;
		const base = [gameId, t.members, topic, iso(t.createdAt), iso(t.completedAt)];
		const mine = rows.filter((r) => r.teamId === t.id);
		if (!mine.length) {
			lines.push([...base, '', '', '', '', '', '', '', '', ''].map(cell).join(','));
			continue;
		}
		for (const r of mine) {
			const station = content.stations.find((s) => s.id === r.stationId);
			const options = r.optionsJson ? (JSON.parse(r.optionsJson) as { title: string; text: string }[]) : [];
			const chosen = r.optionIndex !== null ? options[r.optionIndex] : undefined;
			const trap = r.trapIndex !== null && r.trapIndex !== undefined ? options[r.trapIndex] : undefined;
			lines.push(
				[
					...base,
					station?.title ?? r.stationId,
					station?.question ?? '',
					iso(r.createdAt),
					r.optionIndex === null ? 'own' : r.wasTrap ? 'trap' : 'option',
					chosen?.title ?? r.ownText ?? '',
					chosen?.text ?? '',
					r.wasTrap ? 'yes' : 'no',
					trap?.title ?? '',
					r.model ?? ''
				]
					.map(cell)
					.join(',')
			);
		}
	}
	return '﻿' + lines.join('\r\n') + '\r\n';
}
