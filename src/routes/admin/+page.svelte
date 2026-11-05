<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let testing = $state(false);
	const when = (unix: number | null) => (unix ? new Date(unix * 1000).toLocaleString() : '');
</script>

<svelte:head><title>Admin · The Startup Journey Begins</title></svelte:head>

<main class="admin">
	<h1>Admin</h1>

	<section class="cards">
		<div class="card">
			<p class="label">Current game</p>
			<p class="value">#{data.game.id}</p>
			<p class="muted">started {when(data.game.startedAt)}</p>
		</div>
		<div class="card">
			<p class="label">Teams</p>
			<p class="value">{data.board.teams.length}</p>
			<p class="muted">{data.board.teams.filter((t) => t.completed).length} completed</p>
		</div>
		<div class="card">
			<p class="label">Decisions</p>
			<p class="value">{data.board.decisionsTotal}</p>
			<p class="muted">{data.board.trapsTotal} traps taken</p>
		</div>
		<div class="card">
			<p class="label">LLM</p>
			<p class="value small">{data.llm}</p>
			<p class="muted">{data.baseUrl}</p>
		</div>
	</section>

	<section class="card llm">
		<h2>Model connection</h2>
		{#if data.llmError}
			<p class="error">Last failure {when(Math.floor(data.llmError.at / 1000))}: {data.llmError.message}</p>
		{/if}
		{#if form?.llmTest}
			{#if form.llmTest.ok}
				<p class="ok">Connection OK · {form.llmTest.model} answered in {form.llmTest.ms} ms: <code>{form.llmTest.sample}</code></p>
				{#if form.llmTest.generation.ok}
					<p class="ok">
						Station generation OK · {form.llmTest.generation.count} options in {(form.llmTest.generation.ms / 1000).toFixed(1)} s.
						Trap: <em>{form.llmTest.generation.trapTitle}</em>
					</p>
					<ul class="titles">
						{#each form.llmTest.generation.titles as title (title)}<li>{title}</li>{/each}
					</ul>
				{:else}
					<p class="error">Station generation failed after {(form.llmTest.generation.ms / 1000).toFixed(1)} s: {form.llmTest.generation.message}</p>
				{/if}
			{:else}
				<p class="error">Failed after {form.llmTest.ms} ms: {form.llmTest.message}</p>
			{/if}
		{/if}
		<p class="muted">Runs a tiny request, then one real station generation. The second step can take a minute with slow models.</p>
		<form
			method="post"
			action="?/testLlm"
			use:enhance={() => {
				testing = true;
				return async ({ update }) => {
					testing = false;
					await update();
				};
			}}
		>
			<button type="submit" class="inline" disabled={testing}>{testing ? 'Testing…' : 'Test connection'}</button>
		</form>
	</section>

	<nav class="links">
		<a class="button" href="/admin/qr">Printable QR sheet</a>
		<a class="button" href="/admin/export.csv">Export CSV</a>
		<a class="button secondary" href="/present" target="_blank">Open presenter</a>
	</nav>

	<section>
		<h2>Teams in this game</h2>
		{#if data.board.teams.length === 0}
			<p class="muted">Nobody has joined yet.</p>
		{:else}
			<table>
				<thead>
					<tr><th>Team</th><th>Topic</th><th>Progress</th><th>Traps</th><th>Last station</th></tr>
				</thead>
				<tbody>
					{#each data.board.teams as t (t.id)}
						<tr class:completed={t.completed}>
							<td>{t.members}</td>
							<td>{t.topic}</td>
							<td>{t.done} / {data.board.total}</td>
							<td>{t.traps}</td>
							<td>{t.lastStation ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<section class="danger">
		<h2>Start a new game</h2>
		<p class="muted">
			Ends the current game and starts an empty one for the next class. Phones that joined this game are
			sent back to the join page. Old data stays available for export below.
		</p>
		{#if form?.reset}<p class="ok">A new game was started.</p>{/if}
		{#if form?.error}<p class="error">Please tick the confirmation first.</p>{/if}
		<form method="post" action="?/reset" use:enhance>
			<label class="confirm"><input type="checkbox" name="confirm" /> I want to end the current game</label>
			<button type="submit">Start a new game</button>
		</form>
	</section>

	{#if data.previous.length}
		<section>
			<h2>Previous games</h2>
			<table>
				<thead><tr><th>Game</th><th>Started</th><th>Ended</th><th>Teams</th><th></th></tr></thead>
				<tbody>
					{#each data.previous as g (g.id)}
						<tr>
							<td>#{g.id}</td>
							<td>{when(g.startedAt)}</td>
							<td>{when(g.endedAt)}</td>
							<td>{g.teams}</td>
							<td><a href="/admin/export.csv?game={g.id}">CSV</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</main>

<style>
	.admin {
		max-width: 64rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}
	section {
		margin-bottom: 2rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 1rem;
	}
	.card {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 1rem;
	}
	.card p {
		margin: 0;
	}
	.label {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.value {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.2;
	}
	.value.small {
		font-size: 1.1rem;
		word-break: break-all;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.button {
		display: inline-block;
		text-decoration: none;
		font-weight: 600;
		padding: 0.7rem 1.1rem;
		border-radius: var(--radius);
		background: var(--accent);
		color: #fff;
	}
	.button.secondary {
		background: var(--surface);
		color: var(--text);
		border: 2px solid var(--border);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--surface);
		border-radius: var(--radius);
		overflow: hidden;
	}
	th,
	td {
		text-align: left;
		padding: 0.6rem 0.8rem;
		border-bottom: 1px solid var(--border);
	}
	th {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	tr.completed td:first-child {
		color: #2f8f46;
		font-weight: 600;
	}
	.danger {
		border: 2px solid var(--danger);
		border-radius: var(--radius);
		padding: 1rem;
	}
	.danger form {
		display: grid;
		gap: 0.75rem;
		max-width: 24rem;
	}
	.danger button {
		background: var(--danger);
	}
	.confirm {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.ok {
		color: #2f8f46;
		font-weight: 600;
	}
	.titles {
		margin: 0.25rem 0 0.75rem 1.2rem;
		padding: 0;
	}
	.llm code {
		font-size: 0.9em;
		word-break: break-all;
	}
	button.inline {
		width: auto;
	}
</style>
