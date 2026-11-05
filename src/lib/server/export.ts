import { eq } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { getContent } from './content.js';
import { summarizeDecision } from './decisions.js';

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
			choicesJson: schema.decisions.choicesJson,
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
		'station', 'question', 'decided_at', 'kind', 'choices', 'choice_texts', 'own_idea', 'was_trap', 'trap_title', 'model'
	];
	const lines = [header.join(',')];

	for (const t of teams) {
		const topic = content.topics.find((x) => x.id === t.topicId)?.title ?? t.topicId;
		const base = [gameId, t.members, topic, iso(t.createdAt), iso(t.completedAt)];
		const mine = rows.filter((r) => r.teamId === t.id);
		if (!mine.length) {
			lines.push([...base, '', '', '', '', '', '', '', '', '', ''].map(cell).join(','));
			continue;
		}
		for (const r of mine) {
			const station = content.stations.find((s) => s.id === r.stationId);
			const options = r.optionsJson ? (JSON.parse(r.optionsJson) as { title: string; text: string }[]) : [];
			const s = summarizeDecision(r.optionsJson, r.choicesJson, r.ownText);
			const trap = r.trapIndex !== null && r.trapIndex !== undefined ? options[r.trapIndex] : undefined;
			const kind = r.wasTrap ? 'trap' : s.picked.length === 0 ? 'own' : 'option';
			lines.push(
				[
					...base,
					station?.title ?? r.stationId,
					station?.question ?? '',
					iso(r.createdAt),
					kind,
					s.picked.map((o) => o.title).join(' | '),
					s.picked.map((o) => o.text).join(' | '),
					s.own ?? '',
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
