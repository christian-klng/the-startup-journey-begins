<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.strings);
	const { done, total, decisions } = $derived(data.progress);
	const complete = $derived(total > 0 && done >= total);
	const progressText = $derived(
		s.me_progress.replace('{done}', String(done)).replace('{total}', String(total))
	);
</script>

<svelte:head><title>{data.team.members} · {s.app_title}</title></svelte:head>

<main class="phone">
	<header>
		<p class="eyebrow">{s.me_your_startup}</p>
		<h1>{data.team.members}</h1>
		<p class="muted">{data.team.topic}</p>
	</header>

	<section class="progress" aria-live="polite">
		<div class="ring" style="--p: {total ? done / total : 0}">
			<span>{done}<small>/{total}</small></span>
		</div>
		<p class="progress-text">{progressText}</p>
		<p class="muted">{complete ? s.me_complete : s.me_next}</p>
	</section>

	{#if decisions.length}
		<section>
			<h2>{s.me_decisions}</h2>
			<ol class="decisions">
				{#each decisions as d (d.stationId)}
					<li>
						<span class="station">{d.title}</span>
						<span class="choice">{d.choice}</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}
</main>

<style>
	header {
		margin-bottom: 1.5rem;
	}
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--muted);
		margin: 0;
	}
	h1 {
		margin: 0.2rem 0;
	}
	.progress {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		background: var(--surface);
		border-radius: var(--radius);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	.ring {
		--size: 9rem;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: conic-gradient(var(--accent) calc(var(--p) * 360deg), var(--border) 0);
		display: grid;
		place-items: center;
	}
	.ring span {
		width: calc(var(--size) - 1.6rem);
		height: calc(var(--size) - 1.6rem);
		border-radius: 50%;
		background: var(--surface);
		display: grid;
		place-items: center;
		font-size: 2.2rem;
		font-weight: 700;
	}
	.ring small {
		font-size: 1rem;
		font-weight: 500;
		color: var(--muted);
	}
	.progress-text {
		font-weight: 600;
		margin: 0;
	}
	.decisions {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	.decisions li {
		display: grid;
		gap: 0.15rem;
		padding: 0.75rem 1rem;
		background: var(--surface);
		border-radius: var(--radius);
	}
	.station {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.choice {
		font-weight: 600;
	}
</style>
