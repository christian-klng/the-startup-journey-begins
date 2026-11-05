import type { RequestHandler } from './$types';
import { getBoard } from '#lib/server/board.js';
import { onGameEvent } from '#lib/server/events.js';

/** Server-Sent Events: pushes a full board snapshot on every change, plus a heartbeat. */
export const GET: RequestHandler = ({ request }) => {
	const encoder = new TextEncoder();
	let cleanup = () => {};

	const stream = new ReadableStream({
		start(controller) {
			let closed = false;
			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					cleanup(); // the client went away between the abort signal and this write
				}
			};
			const send = (event: string, data: unknown) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

			const unsubscribe = onGameEvent(() => send('board', getBoard()));
			const heartbeat = setInterval(() => write(': ping\n\n'), 25_000);
			cleanup = () => {
				if (closed) return;
				closed = true;
				unsubscribe();
				clearInterval(heartbeat);
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			};
			request.signal.addEventListener('abort', cleanup);
			send('board', getBoard());
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'x-accel-buffering': 'no'
		}
	});
};
