import type { Option } from './llm.js';

export interface DecisionSummary {
	/** Chosen generated options, in the order they were shown. */
	picked: Option[];
	own: string | null;
	/** Human-readable one-liner: titles joined, own idea appended. */
	text: string;
}

/** Turns a stored decision (options JSON + chosen indexes + own text) into something readable. */
export function summarizeDecision(optionsJson: string | null, choicesJson: string, ownText: string | null): DecisionSummary {
	const options = optionsJson ? (JSON.parse(optionsJson) as Option[]) : [];
	const indexes = JSON.parse(choicesJson) as number[];
	const picked = indexes.map((i) => options[i]).filter((o): o is Option => Boolean(o));
	const own = ownText?.trim() ? ownText.trim() : null;
	const parts = picked.map((o) => o.title);
	if (own) parts.push(own);
	return { picked, own, text: parts.join(' + ') };
}
