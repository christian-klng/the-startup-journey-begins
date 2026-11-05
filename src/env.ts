import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (fallback: string) => (value: string | undefined) => value || fallback;
const integer = (fallback: number) => (value: string | undefined) => {
	if (!value) return fallback;
	const n = Number(value);
	if (!Number.isInteger(n) || n < 0) throw new Error('must be a non-negative integer');
	return n;
};

export const variables = defineEnvVars({
	SCALEWAY_API_KEY: { schema: optional(''), description: 'Scaleway Generative APIs key' },
	SCALEWAY_BASE_URL: { schema: optional('https://api.scaleway.ai/v1') },
	SCALEWAY_MODEL: { schema: optional('llama-3.3-70b-instruct') },
	ADMIN_PASSWORD: { schema: optional('change-me'), description: 'Basic-auth password for /admin' },
	PUBLIC_BASE_URL: {
		public: true,
		schema: optional('http://localhost:3000'),
		description: 'URL phones use; printed under the QR codes'
	},
	DATABASE_PATH: { schema: optional('./data/game.sqlite') },
	CONTENT_DIR: { schema: optional('./content') },
	MIGRATIONS_DIR: { schema: optional('./drizzle') },
	MAX_TEAMS: { schema: integer(40) }
});
