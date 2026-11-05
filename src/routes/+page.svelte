<script lang="ts">
	let { data } = $props();
</script>

<main>
	<h1>The Startup Journey Begins</h1>
	<p>Skeleton is running. Content loaded:</p>
	<ul>
		<li>{data.topics} topics</li>
		<li>{data.stations} stations</li>
		<li>{data.slides} slides</li>
	</ul>
	<p><a href="/present">Presenter view</a> · <a href="/join">Join as a team</a></p>
</main>
