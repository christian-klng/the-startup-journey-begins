import { EventEmitter } from 'node:events';

/** In-process bus. One Node process serves one classroom, so this is all the board needs. */
const bus = new EventEmitter();
bus.setMaxListeners(200);

export type GameEvent = { type: 'team_joined' | 'decision' | 'reset' };

/** Never throws: a failing subscriber (e.g. a closed SSE stream) must not break the request that emitted. */
export const emitGameEvent = (event: GameEvent) => {
	for (const listener of bus.listeners('game') as ((e: GameEvent) => void)[]) {
		try {
			listener(event);
		} catch (e) {
			console.error('[events] listener failed:', e instanceof Error ? e.message : e);
		}
	}
};

export const onGameEvent = (listener: (event: GameEvent) => void) => {
	bus.on('game', listener);
	return () => bus.off('game', listener);
};
