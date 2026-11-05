import { isNull } from 'drizzle-orm';
import { db, schema } from './db/index.js';

/** The game currently running: the one without an end date. Created on demand. */
export function getCurrentGame() {
	const open = db.select().from(schema.games).where(isNull(schema.games.endedAt)).get();
	if (open) return open;
	return db.insert(schema.games).values({}).returning().get();
}
