import QRCode from 'qrcode';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';
import { getContent } from '#lib/server/content.js';
import { getBoard } from '#lib/server/board.js';
import { PUBLIC_BASE_URL } from '$app/env/public';

export const load: PageServerLoad = async () => {
	const { slides, strings } = getContent();
	const joinUrl = `${PUBLIC_BASE_URL.replace(/\/$/, '')}/join`;
	const joinQr = await QRCode.toString(joinUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

	const rendered = await Promise.all(
		slides.map(async (slide) => (slide.type === 'markdown' ? { ...slide, html: await marked.parse(slide.body) } : slide))
	);

	return { slides: rendered, strings, join: { url: joinUrl, qr: joinQr }, board: getBoard() };
};
