<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Admin</title></svelte:head>

<main class="phone">
	<h1>Admin</h1>
	<ul>
		<li>Game #{data.game.id}, started {new Date(data.game.startedAt * 1000).toLocaleString()}, {data.game.teams} teams</li>
		<li>LLM: {data.llm}</li>
		<li>Public URL: {data.baseUrl}</li>
	</ul>
	<p><a href="/admin/qr">Printable QR sheet</a> · <a href="/present">Presenter view</a></p>
</main>
