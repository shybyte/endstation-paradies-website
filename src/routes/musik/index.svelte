<script context="module">
	import 'aplayer/dist/APlayer.min.css';
	export function preload({ params, query }) {
		return this.fetch(`musik.json`).then(r => r.json()).then(songs => {
			return { songs: songs };
		});
	}
</script>

<script>
	export let songs;
</script>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		line-height: 1.5;
	}

	li {

	}
</style>

<svelte:head>
	<title>Musik</title>
</svelte:head>

<h2>Lieder</h2>
<ul>
	{#each songs as song}
		<!-- we're using the non-standard `rel=prefetch` attribute to
				tell Sapper to load the data for the page as soon as
				the user hovers over the link or taps it, instead of
				waiting for the 'click' event -->
		<li><a rel='prefetch' href='musik/{song.slug}'>{song.title}</a></li>
	{/each}
</ul>
