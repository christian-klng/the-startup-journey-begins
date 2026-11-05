<script lang="ts">
	import { onMount } from 'svelte';
	import type { Board } from '#lib/server/board.js';

	let { initial }: { initial: Board } = $props();
	// svelte-ignore state_referenced_locally -- initial snapshot only; SSE takes over
	let board = $state<Board>(initial);
	let live = $state(false);

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
		<ul class="teams" style="--cols: {board.teams.length > 12 ? 3 : board.teams.length > 6 ? 2 : 1}">
			{#each board.teams as t (t.id)}
				<li class:completed={t.completed}>
					<div class="head">
						<span class="name">{t.members}</span>
						<span class="count">{t.done}/{board.total}</span>
					</div>
					<div class="meta">{t.topic}</div>
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
		gap: 0.8rem 1.2rem;
	}
	li {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 0.8rem 1rem;
		border: 2px solid transparent;
	}
	li.completed {
		border-color: #3fb950;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.name {
		font-weight: 700;
		font-size: 1.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--muted);
	}
	.meta {
		color: var(--muted);
		font-size: 0.95rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar {
		margin-top: 0.5rem;
		height: 0.5rem;
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
