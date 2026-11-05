<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>QR sheet</title></svelte:head>

<div class="toolbar">
	<a href="/admin">← Admin</a>
	<button type="button" onclick={() => window.print()}>Print</button>
</div>

<section class="sheet">
	<p class="kind">Join</p>
	<h1>Found your startup</h1>
	<div class="qr">{@html data.join.svg}</div>
	<p class="url">{data.join.url}</p>
</section>

{#each data.stations as s (s.number)}
	<section class="sheet">
		<p class="kind">Station {s.number} of {data.stations.length}</p>
		<h1>{s.title}</h1>
		<p class="question">{s.question}</p>
		<div class="qr">{@html s.svg}</div>
		<p class="url">{s.url}</p>
	</section>
{/each}

<style>
	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
	}
	.toolbar button {
		width: auto;
	}
	.sheet {
		max-width: 40rem;
		margin: 1rem auto;
		padding: 2rem;
		background: var(--surface);
		border-radius: var(--radius);
		text-align: center;
		page-break-after: always;
		break-after: page;
	}
	.kind {
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
		margin: 0;
	}
	h1 {
		font-size: 2.4rem;
		margin: 0.25rem 0 0.5rem;
	}
	.question {
		font-size: 1.4rem;
		margin: 0 0 1rem;
	}
	.qr {
		width: min(70vw, 22rem);
		margin: 0 auto;
	}
	.qr :global(svg) {
		width: 100%;
		height: auto;
	}
	.url {
		font-family: ui-monospace, monospace;
		color: var(--muted);
		word-break: break-all;
	}
	@media print {
		.toolbar {
			display: none;
		}
		.sheet {
			max-width: none;
			margin: 0;
			border-radius: 0;
			min-height: 95vh;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
		h1 {
			font-size: 3rem;
		}
	}
</style>
