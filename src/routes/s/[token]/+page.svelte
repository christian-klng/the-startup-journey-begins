<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const s = $derived(data.strings);
	const multi = $derived(data.station.select === 'multi');
	let single = $state<string>('');
	let picked = $state<string[]>([]);
	let own = $state('');
	let submitting = $state(false);
	$effect(() => {
		if (form?.own) own = form.own;
	});
	const selected = $derived(multi ? picked : single ? [single] : []);
	const full = $derived(multi && picked.length >= data.station.max);
	const canSubmit = $derived(
		selected.length > 0 && selected.length <= data.station.max && (!selected.includes('own') || own.trim().length >= 3)
	);
	const isOn = (value: string) => selected.includes(value);
	const instruction = $derived(
		multi ? s.station_choose_multi.replace('{max}', String(data.station.max)) : s.station_choose_single
	);
	const counter = $derived(
		multi ? s.station_picked.replace('{n}', String(picked.length)).replace('{max}', String(data.station.max)) : ''
	);
</script>

<svelte:head><title>{data.station.title} · {s.app_title}</title></svelte:head>

<main class="phone">
	<p class="eyebrow">
		{s.station_label} · {s.me_progress.replace('{done}', String(data.progress.done)).replace('{total}', String(data.progress.total))}
	</p>
	<h1>{data.station.title}</h1>
	<p class="question">{data.station.question}</p>
	{#if data.station.hint}<p class="muted hint">{data.station.hint}</p>{/if}

	{#if data.decided}
		<section class="card decided">
			<p class="eyebrow">{s.station_your_decision}</p>
			{#each data.decided.picked as o (o.title)}
				<p class="choice">{o.title}</p>
				<p class="muted">{o.text}</p>
			{/each}
			{#if data.decided.own}
				<p class="choice">{s.station_own_idea}</p>
				<p class="muted">{data.decided.own}</p>
			{/if}
		</section>
		{#if data.decided.wasTrap && data.station.reveal === 'immediate'}
			<section class="card trap">
				<p>{s.station_trap_reveal}</p>
			</section>
		{/if}
		<a class="button" href="/me">{s.station_back}</a>
	{:else}
		{#if form?.error}<p class="error">{s.station_error}</p>{/if}
		{#await data.options}
			<section class="card loading" aria-live="polite">
				<div class="spinner"></div>
				<p>{s.station_thinking}</p>
			</section>
		{:then options}
			<p class="instruction">{instruction}</p>
			<form
				method="post"
				action="?/decide"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<div class="options">
					{#each options as option, i (i)}
						<label class="option" class:selected={isOn(String(i))} class:dimmed={full && !isOn(String(i))}>
							{#if multi}
								<input type="checkbox" name="option" value={String(i)} bind:group={picked} disabled={full && !isOn(String(i))} />
							{:else}
								<input type="radio" name="option" value={String(i)} bind:group={single} />
							{/if}
							<span class="title">{option.title}</span>
							<span class="text">{option.text}</span>
						</label>
					{/each}
					<label class="option" class:selected={isOn('own')} class:dimmed={full && !isOn('own')}>
						{#if multi}
							<input type="checkbox" name="option" value="own" bind:group={picked} disabled={full && !isOn('own')} />
						{:else}
							<input type="radio" name="option" value="own" bind:group={single} />
						{/if}
						<span class="title">{s.station_own_idea}</span>
						<textarea
							name="own"
							rows="3"
							maxlength="400"
							bind:value={own}
							onfocus={() => {
								if (multi) {
									if (!picked.includes('own') && !full) picked = [...picked, 'own'];
								} else single = 'own';
							}}
						></textarea>
					</label>
				</div>
				{#if multi}<p class="counter muted">{counter}</p>{/if}
				<button type="submit" disabled={!canSubmit || submitting}>{s.station_submit}</button>
			</form>
		{:catch}
			<section class="card trap">
				<p>{s.error_llm}</p>
				<button type="button" onclick={() => location.reload()}>{s.station_retry}</button>
			</section>
		{/await}
	{/if}
</main>

<style>
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--muted);
		margin: 0;
	}
	h1 {
		margin: 0.2rem 0 0.5rem;
	}
	.question {
		font-size: 1.15rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
	}
	.hint {
		margin-bottom: 1.25rem;
	}
	.instruction {
		font-weight: 600;
		margin: 1rem 0 0.5rem;
	}
	.card {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 1rem;
		margin: 1rem 0;
	}
	.card p {
		margin: 0.25rem 0;
	}
	.loading {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		padding: 2rem 1rem;
		color: var(--muted);
	}
	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 4px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.options {
		display: grid;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
	}
	.option {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 0.75rem;
		align-items: start;
		padding: 0.9rem 1rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.option.selected {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.option.dimmed {
		opacity: 0.45;
	}
	.counter {
		text-align: center;
		margin: -0.5rem 0 1rem;
	}
	.option input[type='radio'],
	.option input[type='checkbox'] {
		grid-row: span 2;
		margin-top: 0.3rem;
	}
	.option .title {
		font-weight: 600;
	}
	.option .text {
		font-size: 0.92rem;
		color: var(--muted);
	}
	.option textarea {
		grid-column: 2;
		margin-top: 0.4rem;
	}
	.decided .choice {
		font-size: 1.15rem;
		font-weight: 600;
	}
	.trap {
		border: 2px solid var(--accent);
		background: var(--accent-soft);
		font-weight: 600;
	}
	.button {
		display: block;
		text-align: center;
		text-decoration: none;
		font-weight: 600;
		padding: 0.9rem 1.2rem;
		border-radius: var(--radius);
		background: var(--accent);
		color: #fff;
	}
</style>
