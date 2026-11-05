<script lang="ts">
	import type { Board } from '#lib/server/board.js';
	let { board }: { board: Board } = $props();
	const finished = $derived(board.teams.filter((t) => t.completed).length);
	const trapRate = $derived(board.decisionsTotal ? Math.round((board.trapsTotal / board.decisionsTotal) * 100) : 0);
	const ownIdeas = $derived(board.teams.reduce((n, t) => n + t.decisions.filter((d) => d.own).length, 0));
</script>

<div class="stats">
	<div><strong>{board.teams.length}</strong><span>startups founded</span></div>
	<div><strong>{finished}</strong><span>completed the journey</span></div>
	<div><strong>{board.decisionsTotal}</strong><span>decisions taken</span></div>
	<div><strong>{board.trapsTotal}</strong><span>traps taken ({trapRate}%)</span></div>
	<div><strong>{ownIdeas}</strong><span>own ideas written</span></div>
</div>

<ul class="teams">
	{#each board.teams as t (t.id)}
		<li>
			<span class="name">{t.name}</span>
			<span class="topic">{t.topic}</span>
			<span class="traps" class:none={t.traps === 0}>{t.traps} {t.traps === 1 ? 'trap' : 'traps'}</span>
		</li>
	{/each}
</ul>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.stats div {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 1rem;
		display: grid;
		text-align: center;
	}
	.stats strong {
		font-size: 3rem;
		line-height: 1;
	}
	.stats span {
		color: var(--muted);
		margin-top: 0.4rem;
	}
	.teams {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 0.5rem 1rem;
	}
	li {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: 0.75rem;
		align-items: baseline;
		padding: 0.4rem 0.8rem;
		background: var(--surface);
		border-radius: 10px;
	}
	.topic {
		grid-column: 1 / -1;
	}
	.name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.topic {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.traps {
		font-weight: 600;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}
	.traps.none {
		color: #3fb950;
	}
</style>
