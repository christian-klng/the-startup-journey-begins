import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { getContent, maxPicks, type Station } from './content.js';
import { generateOptions, type Option } from './llm.js';
import { getTeamProgress, type Team } from './teams.js';
import { emitGameEvent } from './events.js';

/**
 * Makes sure every station from stations.yaml has a row with a QR token.
 * Tokens are generated once and kept across restarts, so printed QR codes stay valid.
 */
export function syncStations() {
	const existing = new Map(db.select().from(schema.stations).all().map((s) => [s.id, s]));
	getContent().stations.forEach((station, position) => {
		const row = existing.get(station.id);
		if (row) {
			if (row.position !== position) {
				db.update(schema.stations).set({ position }).where(eq(schema.stations.id, station.id)).run();
			}
			return;
		}
		db.insert(schema.stations)
			.values({ id: station.id, token: randomBytes(9).toString('base64url'), position })
			.run();
	});
}

export function getStationByToken(token: string): Station | undefined {
	const row = db.select().from(schema.stations).where(eq(schema.stations.token, token)).get();
	return row && getContent().stations.find((s) => s.id === row.id);
}

/** All stations with their tokens, for the printable QR sheet. */
export function listStationsWithTokens() {
	const rows = db.select().from(schema.stations).all();
	return getContent()
		.stations.map((s) => ({ ...s, token: rows.find((r) => r.id === s.id)?.token ?? '' }))
		.filter((s) => s.token);
}

export type Generation = typeof schema.generations.$inferSelect;
export type Decision = typeof schema.decisions.$inferSelect;

export function getDecision(team: Team, station: Station): Decision | undefined {
	return db
		.select()
		.from(schema.decisions)
		.where(and(eq(schema.decisions.teamId, team.id), eq(schema.decisions.stationId, station.id)))
		.get();
}

export function getGeneration(team: Team, station: Station): Generation | undefined {
	return db
		.select()
		.from(schema.generations)
		.where(and(eq(schema.generations.teamId, team.id), eq(schema.generations.stationId, station.id)))
		.get();
}

export function parseOptions(gen: Generation): Option[] {
	return JSON.parse(gen.optionsJson) as Option[];
}

const inflight = new Map<string, Promise<Generation>>();

/**
 * Returns the cached generation for (team, station) or creates it via the LLM.
 * Concurrent requests (double tap, refresh) share one in-flight call.
 */
export function getOrCreateGeneration(team: Team, station: Station): Promise<Generation> {
	const cached = getGeneration(team, station);
	if (cached) return Promise.resolve(cached);

	const key = `${team.id}:${station.id}`;
	const running = inflight.get(key);
	if (running) return running;

	const topic = getContent().topics.find((t) => t.id === team.topicId) ?? { id: team.topicId, title: team.topicId };
	const previous = getTeamProgress(team).decisions.map(({ title, question, choice, detail }) => ({ title, question, choice, detail }));

	const promise = generateOptions({ members: team.members, topic, station, previous })
		.then((result) =>
			db
				.insert(schema.generations)
				.values({
					teamId: team.id,
					stationId: station.id,
					model: result.model,
					optionsJson: JSON.stringify(result.options),
					trapIndex: result.trapIndex
				})
				.returning()
				.get()
		)
		.finally(() => inflight.delete(key));
	inflight.set(key, promise);
	return promise;
}

export class DecisionError extends Error {
	constructor(public code: 'already_decided' | 'no_generation' | 'invalid_option' | 'empty_text' | 'nothing_chosen' | 'too_many') {
		super(code);
	}
}

/**
 * Records the team's picks: option indexes and/or an own idea. The own idea counts as one pick
 * towards the station's limit.
 */
export function recordDecision(
	team: Team,
	station: Station,
	input: { optionIndexes: number[]; ownText: string | null }
): Decision {
	if (getDecision(team, station)) throw new DecisionError('already_decided');
	const gen = getGeneration(team, station);
	if (!gen) throw new DecisionError('no_generation');

	const options = parseOptions(gen);
	const indexes = [...new Set(input.optionIndexes)].sort((a, b) => a - b);
	if (indexes.some((i) => !Number.isInteger(i) || i < 0 || i >= options.length)) throw new DecisionError('invalid_option');
	const ownText = input.ownText?.trim() ? input.ownText.trim() : null;
	if (input.ownText !== null && !ownText) throw new DecisionError('empty_text');
	if (ownText && ownText.length < 3) throw new DecisionError('empty_text');
	const picks = indexes.length + (ownText ? 1 : 0);
	if (picks === 0) throw new DecisionError('nothing_chosen');
	if (picks > maxPicks(station)) throw new DecisionError('too_many');

	const decision = db
		.insert(schema.decisions)
		.values({
			teamId: team.id,
			stationId: station.id,
			generationId: gen.id,
			choicesJson: JSON.stringify(indexes),
			ownText,
			wasTrap: indexes.includes(gen.trapIndex)
		})
		.returning()
		.get();

	const { done, total } = getTeamProgress(team);
	if (done >= total && !team.completedAt) {
		db.update(schema.teams).set({ completedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.teams.id, team.id)).run();
	}
	emitGameEvent({ type: 'decision' });
	return decision;
}
