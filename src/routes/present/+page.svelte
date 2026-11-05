<script lang="ts">
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import Board from '#lib/components/Board.svelte';
	import Conclusion from '#lib/components/Conclusion.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const slides = $derived(data.slides);
	const count = $derived(slides.length);

	const fromUrl = Number(page.url.searchParams.get('slide'));
	// svelte-ignore state_referenced_locally -- slide count is read once at load
	let index = $state(Number.isInteger(fromUrl) && fromUrl >= 1 ? Math.min(fromUrl, data.slides.length) - 1 : 0);
	const slide = $derived(slides[index]);

	function go(delta: number) {
		const next = Math.min(count - 1, Math.max(0, index + delta));
		if (next === index) return;
		index = next;
		replaceState(`?slide=${index + 1}`, {});
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') go(1);
		else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
		else if (e.key === 'Home') go(-index);
		else if (e.key === 'End') go(count - 1 - index);
		else if (e.key === 'f' || e.key === 'F') {
			if (document.fullscreenElement) document.exitFullscreen();
			else document.documentElement.requestFullscreen();
		} else return;
		e.preventDefault();
	}
</script>

<svelte:window {onkeydown} />
<svelte:head><title>{data.strings.app_title} · Presenter</title></svelte:head>

<div class="present">
	{#key index}
		<section class="slide {slide.type}">
			{#if slide.type === 'title'}
				<p class="eyebrow">{data.strings.app_title}</p>
				<h1 class="big">{slide.title}</h1>
				{#if slide.subtitle}<p class="subtitle">{slide.subtitle}</p>{/if}
			{:else if slide.type === 'markdown'}
				<p class="eyebrow">{data.strings.app_title}</p>
				{#if slide.title}<h1>{slide.title}</h1>{/if}
				<div class="prose">{@html slide.html}</div>
			{:else if slide.type === 'join'}
				<p class="eyebrow">{data.strings.app_title}</p>
				<h1>{slide.title ?? data.strings.join_heading}</h1>
				<div class="join-grid">
					<div class="qr">{@html data.join.qr}</div>
					<div class="join-info">
						{#if slide.wifi}
							<p class="label">WiFi</p>
							<p class="value">{slide.wifi.ssid}</p>
							{#if slide.wifi.password}<p class="label">Password</p><p class="value">{slide.wifi.password}</p>{/if}
						{/if}
						<p class="label">Or open</p>
						<p class="value url">{data.join.url}</p>
					</div>
				</div>
			{:else if slide.type === 'board'}
				<p class="eyebrow">{data.strings.app_title}</p>
				<h1>{slide.title ?? ''}</h1>
				<Board initial={data.board} />
			{:else if slide.type === 'conclusion'}
				<p class="eyebrow">{data.strings.app_title}</p>
				<h1>{slide.title ?? ''}</h1>
				<Conclusion board={data.board} />
			{/if}
		</section>
	{/key}

	<nav class="controls">
		<button type="button" onclick={() => go(-1)} disabled={index === 0} aria-label="Previous slide">‹</button>
		<span>{index + 1} / {count}</span>
		<button type="button" onclick={() => go(1)} disabled={index === count - 1} aria-label="Next slide">›</button>
	</nav>
</div>

<style>
	.present {
		--bg: #16181d;
		--surface: #23262b;
		--text: #ffffff;
		--muted: #c4c5c7;
		--border: #3a3d41;
		--accent: #d50c2f;
		--accent-soft: #3a1a20;
		position: fixed;
		inset: 0;
		background: var(--bg);
		color: var(--text);
		font-size: clamp(16px, 1.6vw, 28px);
		overflow: hidden;
	}
	/* brand rule along the top edge */
	.present::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 0.45vh;
		background: var(--accent);
	}
	.present :global(.eyebrow) {
		font-size: 0.7em;
		margin-bottom: 0.6em;
	}
	.slide {
		position: absolute;
		inset: 0;
		padding: 4vh 6vw 10vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		animation: fade 0.25s ease;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	.slide.board,
	.slide.conclusion {
		justify-content: flex-start;
	}
	h1 {
		font-family: var(--font-head);
		font-weight: 900;
		font-size: 2.6em;
		margin: 0 0 0.5em;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.slide.title {
		align-items: flex-start;
	}
	.big {
		font-size: 4.6em;
		max-width: 13ch;
	}
	.subtitle {
		font-size: 1.4em;
		font-weight: 300;
		color: var(--muted);
		max-width: 28em;
		margin: 0;
	}
	.prose {
		font-size: 1.45em;
		font-weight: 300;
		line-height: 1.5;
		max-width: 40em;
	}
	.prose :global(ul),
	.prose :global(ol) {
		padding-left: 1.2em;
	}
	.prose :global(li) {
		margin: 0.3em 0;
	}
	.prose :global(p) {
		margin: 0.5em 0;
	}
	.prose :global(strong) {
		color: var(--accent);
	}
	.join-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 5vw;
		align-items: center;
	}
	.qr {
		width: min(50vh, 40vw);
		background: #fff;
		padding: 1.5vh;
		border-radius: 8px;
	}
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	.join-info .label {
		margin: 0;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		font-size: 0.7em;
	}
	.join-info .value {
		margin: 0.1em 0 0.9em;
		font-family: var(--font-head);
		font-size: 2.2em;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.join-info .url {
		font-size: 1.4em;
		font-family: ui-monospace, monospace;
		word-break: break-all;
	}
	.controls {
		position: absolute;
		bottom: 2vh;
		right: 3vw;
		display: flex;
		align-items: center;
		gap: 0.6em;
		color: var(--muted);
		font-size: 0.9em;
		opacity: 0.35;
		transition: opacity 0.2s;
	}
	.controls:hover {
		opacity: 1;
	}
	.controls button {
		width: 2.2em;
		height: 2.2em;
		padding: 0;
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		font-size: 1.3em;
		line-height: 1;
	}
	.controls button:hover {
		background: var(--accent);
	}
	.controls button:disabled {
		opacity: 0.3;
	}
</style>
