import { getContent } from '#lib/server/content.js';

export function load() {
	const c = getContent();
	return { topics: c.topics.length, stations: c.stations.length, slides: c.slides.length };
}
