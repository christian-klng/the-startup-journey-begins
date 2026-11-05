import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = sql`(unixepoch())`;

/** One row per game run. Reset creates a new game; old rows stay for history. */
export const games = sqliteTable('games', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	startedAt: integer('started_at').notNull().default(now),
	endedAt: integer('ended_at')
});

/** A startup / NGO founded by one phone. */
export const teams = sqliteTable('teams', {
	id: text('id').primaryKey(), // random id, also stored in the cookie
	gameId: integer('game_id')
		.notNull()
		.references(() => games.id),
	members: text('members').notNull(),
	topicId: text('topic_id').notNull(),
	createdAt: integer('created_at').notNull().default(now),
	completedAt: integer('completed_at')
});

/** Stations are defined in content/stations.yaml; this table only holds the QR tokens. */
export const stations = sqliteTable('stations', {
	id: text('id').primaryKey(), // slug from YAML
	token: text('token').notNull().unique(),
	position: integer('position').notNull()
});

/** One LLM generation per (team, station). Cached so a page refresh never regenerates. */
export const generations = sqliteTable('generations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	teamId: text('team_id')
		.notNull()
		.references(() => teams.id),
	stationId: text('station_id').notNull(),
	model: text('model').notNull(),
	optionsJson: text('options_json').notNull(), // shuffled options as shown to the student
	trapIndex: integer('trap_index').notNull(),
	createdAt: integer('created_at').notNull().default(now)
});

export const decisions = sqliteTable('decisions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	teamId: text('team_id')
		.notNull()
		.references(() => teams.id),
	stationId: text('station_id').notNull(),
	generationId: integer('generation_id').references(() => generations.id),
	choicesJson: text('choices_json').notNull().default('[]'), // indexes into the generation's options
	ownText: text('own_text'), // the team's own idea, may accompany chosen options
	wasTrap: integer('was_trap', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull().default(now)
});
