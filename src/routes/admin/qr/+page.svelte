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
	<p class="eyebrow">Join</p>
	<h1>Found your startup</h1>
	<div class="qr">{@html data.join.svg}</div>
	<p class="url">{data.join.url}</p>
</section>

{#each data.stations as s (s.number)}
	<section class="sheet">
		<p class="eyebrow">Station {s.number} of {data.stations.length}</p>
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
		position: relative;
		max-width: 40rem;
		margin: 1rem auto;
		padding: 2.5rem 2rem 2rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		text-align: center;
		page-break-after: always;
		break-after: page;
		overflow: hidden;
	}
	.sheet::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 8px;
		background: var(--accent);
	}
	.sheet :global(.eyebrow) {
		justify-content: center;
		font-size: 0.9rem;
	}
	h1 {
		font-size: 2.8rem;
		font-weight: 900;
		margin: 0.25rem 0 0.5rem;
	}
	.question {
		font-size: 1.4rem;
		font-weight: 300;
		margin: 0 0 1.25rem;
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
			font-size: 3.4rem;
		}
		.sheet::before {
			height: 12px;
		}
	}
</style>
