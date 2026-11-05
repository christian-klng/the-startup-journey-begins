<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const s = $derived(data.strings);
	let submitting = $state(false);
	let topic = $state('');
	$effect(() => {
		if (form?.values.topicId) topic = form.values.topicId;
	});
</script>

<svelte:head><title>{s.join_heading} · {s.app_title}</title></svelte:head>

<main class="phone">
	<h1>{s.join_heading}</h1>

	{#if form?.error === 'full'}
		<p class="error">{s.join_error_full}</p>
	{:else if form?.error}
		<p class="error">{s.join_error_fields}</p>
	{/if}

	<form
		method="post"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="next" value={data.next} />
		<label>
			<span>{s.join_members}</span>
			<input name="members" required minlength="2" maxlength="120" value={form?.values.members ?? ''} autocomplete="off" />
		</label>

		<fieldset>
			<legend>{s.join_topic}</legend>
			{#each data.topics as t (t.id)}
				<label class="topic" class:selected={topic === t.id}>
					<input type="radio" name="topic" value={t.id} bind:group={topic} required />
					<span class="topic-title">{t.title}</span>
					{#if t.description}<span class="topic-desc">{t.description}</span>{/if}
				</label>
			{/each}
		</fieldset>

		<button type="submit" disabled={submitting}>{s.join_submit}</button>
	</form>
</main>

<style>
	form {
		display: grid;
		gap: 1.25rem;
	}
	label > span {
		display: block;
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	legend {
		font-weight: 600;
		margin-bottom: 0.35rem;
	}
	.topic {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 0.75rem;
		align-items: start;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.topic.selected {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.topic input {
		grid-row: span 2;
		margin-top: 0.3rem;
	}
	.topic-title {
		font-weight: 600;
	}
	.topic-desc {
		font-size: 0.9rem;
		color: var(--muted);
	}
</style>
