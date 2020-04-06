<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style>
	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		text-align: center;
	}
</style>

<Nav {segment}/>

<main>
	<slot></slot>
</main>

<footer>
	All content CC-BY-SA
</footer>
