import { eq, isNull } from 'drizzle-orm';
import { db, schema } from './db/index.js';
import { emitGameEvent } from './events.js';

/** The game currently running: the one without an end date. Created on demand. */
export function getCurrentGame() {
	const open = db.select().from(schema.games).where(isNull(schema.games.endedAt)).get();
	if (open) return open;
	return db.insert(schema.games).values({}).returning().get();
}

/**
 * Ends the current game and opens a new one. Old teams and decisions stay in the
 * database for export; student cookies pointing at the old game are cleared on
 * their next request.
 */
export function resetGame() {
	const current = getCurrentGame();
	db.update(schema.games).set({ endedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.games.id, current.id)).run();
	const next = db.insert(schema.games).values({}).returning().get();
	emitGameEvent({ type: 'reset' });
	return next;
}
