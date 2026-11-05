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
				<h1 class="big">{slide.title}</h1>
				{#if slide.subtitle}<p class="subtitle">{slide.subtitle}</p>{/if}
			{:else if slide.type === 'markdown'}
				{#if slide.title}<h1>{slide.title}</h1>{/if}
				<div class="prose">{@html slide.html}</div>
			{:else if slide.type === 'join'}
				<h1>{slide.title ?? data.strings.join_heading}</h1>
				<div class="join">
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
				<h1>{slide.title ?? ''}</h1>
				<Board initial={data.board} />
			{:else if slide.type === 'conclusion'}
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
		--bg: #15130f;
		--surface: #23201a;
		--text: #f5f3ee;
		--muted: #a9a398;
		--border: #3a362e;
		--accent: #ff6b2c;
		--accent-soft: #3a2316;
		position: fixed;
		inset: 0;
		background: var(--bg);
		color: var(--text);
		font-size: clamp(16px, 1.6vw, 28px);
		overflow: hidden;
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
		font-size: 2.6em;
		margin: 0 0 0.5em;
		line-height: 1.1;
	}
	.big {
		font-size: 4.2em;
		text-align: center;
	}
	.subtitle {
		text-align: center;
		font-size: 1.6em;
		color: var(--muted);
		margin: 0;
	}
	.prose {
		font-size: 1.5em;
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
	.join {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 5vw;
		align-items: center;
	}
	.qr {
		width: min(50vh, 40vw);
		background: #fff;
		padding: 1.5vh;
		border-radius: 1vh;
	}
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	.join-info .label {
		margin: 0;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.8em;
	}
	.join-info .value {
		margin: 0.1em 0 0.9em;
		font-size: 2.2em;
		font-weight: 700;
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
	.controls button:disabled {
		opacity: 0.3;
	}
</style>
