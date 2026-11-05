<script lang="ts">
	import { onMount } from 'svelte';
	import type { Board } from '#lib/server/board.js';

	let { initial }: { initial: Board } = $props();
	// svelte-ignore state_referenced_locally -- initial snapshot only; SSE takes over
	let board = $state<Board>(initial);
	let live = $state(false);

	/** 1 column up to 4 teams, 2 up to 8, 3 up to 15, then 4. */
	const cols = $derived(board.teams.length <= 4 ? 1 : board.teams.length <= 8 ? 2 : board.teams.length <= 15 ? 3 : 4);

	onMount(() => {
		const source = new EventSource('/api/events');
		source.addEventListener('board', (e) => {
			board = JSON.parse((e as MessageEvent).data);
			live = true;
		});
		source.onerror = () => (live = false);
		return () => source.close();
	});
</script>

<div class="board">
	<div class="status" class:live>{live ? 'live' : 'reconnecting…'}</div>
	{#if board.teams.length === 0}
		<p class="empty">No startups yet. Scan the QR code to found one.</p>
	{:else}
		<ul class="teams" style="--cols: {cols}" class:dense={board.teams.length > 15}>
			{#each board.teams as t (t.id)}
				<li class:completed={t.completed}>
					<div class="head">
						<span class="name">{t.members}</span>
						<span class="topic">{t.topic}</span>
						<span class="count">{t.done}/{board.total}</span>
					</div>
					<div class="bar"><span style="width: {board.total ? (t.done / board.total) * 100 : 0}%"></span></div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.board {
		position: relative;
		width: 100%;
	}
	.status {
		position: absolute;
		top: -2.5rem;
		right: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.status.live::before {
		content: '●';
		color: #3fb950;
		margin-right: 0.3rem;
	}
	.empty {
		font-size: 1.6rem;
		color: var(--muted);
		text-align: center;
	}
	.teams {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: 0.6rem 1rem;
	}
	li {
		background: var(--surface);
		border-radius: 10px;
		padding: 0.7rem 0.9rem;
		border: 2px solid transparent;
	}
	li.completed {
		border-color: #3fb950;
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: baseline;
		gap: 0.6rem;
	}
	.name {
		font-weight: 700;
		font-size: 1.2rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.topic {
		color: var(--muted);
		font-size: 0.9rem;
		white-space: nowrap;
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--muted);
		font-size: 0.95rem;
	}
	.dense li {
		padding: 0.35rem 0.7rem;
	}
	.dense .name {
		font-size: 0.95rem;
	}
	.dense .topic {
		font-size: 0.75rem;
	}
	.bar {
		margin-top: 0.35rem;
		height: 0.4rem;
		background: var(--border);
		border-radius: 999px;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.4s ease;
	}
</style>
