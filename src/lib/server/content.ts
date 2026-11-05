import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { CONTENT_DIR } from '$app/env/private';

const contentDir = () => CONTENT_DIR;

const Topic = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional()
});

const Station = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string(),
	question: z.string(),
	hint: z.string().optional(),
	options: z.number().int().min(2).max(6).default(4),
	trap: z.enum(['absurd', 'illegal', 'unethical', 'ruinous']).default('absurd'),
	reveal: z.enum(['immediate', 'end', 'never']).default('immediate')
});

const Slide = z.discriminatedUnion('type', [
	z.object({ type: z.literal('title'), title: z.string(), subtitle: z.string().optional() }),
	z.object({ type: z.literal('markdown'), title: z.string().optional(), body: z.string() }),
	z.object({
		type: z.literal('join'),
		title: z.string().optional(),
		wifi: z.object({ ssid: z.string(), password: z.string().optional() }).optional()
	}),
	z.object({ type: z.literal('board'), title: z.string().optional() }),
	z.object({ type: z.literal('conclusion'), title: z.string().optional() })
]);

const Strings = z.record(z.string(), z.string());

export type Topic = z.infer<typeof Topic>;
export type Station = z.infer<typeof Station>;
export type Slide = z.infer<typeof Slide>;

export interface Content {
	topics: Topic[];
	stations: Station[];
	slides: Slide[];
	strings: Record<string, string>;
}

function load<T>(file: string, schema: z.ZodType<T>): T {
	const raw = readFileSync(join(contentDir(), file), 'utf8');
	const result = schema.safeParse(parse(raw));
	if (!result.success) {
		throw new Error(`Invalid ${file}:\n${result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
	}
	return result.data;
}

let cache: Content | undefined;

/** Loads and validates all YAML content once per process. */
export function getContent(): Content {
	if (cache) return cache;
	const stations = load('stations.yaml', z.array(Station));
	const ids = new Set<string>();
	for (const s of stations) {
		if (ids.has(s.id)) throw new Error(`Duplicate station id "${s.id}" in stations.yaml`);
		ids.add(s.id);
	}
	cache = {
		topics: load('topics.yaml', z.array(Topic)),
		stations,
		slides: load('slides.yaml', z.array(Slide)),
		strings: load('strings.yaml', Strings)
	};
	return cache;
}

export function t(key: string): string {
	return getContent().strings[key] ?? key;
}
