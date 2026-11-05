import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import { getContent } from './content';

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
