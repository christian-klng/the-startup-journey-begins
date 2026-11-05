import QRCode from 'qrcode';
import type { PageServerLoad } from './$types';
import { listStationsWithTokens } from '#lib/server/stations.js';
import { PUBLIC_BASE_URL } from '$app/env/public';

const svg = (url: string) => QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

export const load: PageServerLoad = async () => {
	const base = PUBLIC_BASE_URL.replace(/\/$/, '');
	const joinUrl = `${base}/join`;
	const stations = await Promise.all(
		listStationsWithTokens().map(async (s, i) => {
			const url = `${base}/s/${s.token}`;
			return { number: i + 1, title: s.title, question: s.question, url, svg: await svg(url) };
		})
	);
	return { join: { url: joinUrl, svg: await svg(joinUrl) }, stations };
};
