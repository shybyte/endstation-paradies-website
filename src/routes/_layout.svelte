<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style>
	main {
		position: relative;
		max-width: 60em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		margin-top: 3em;
		text-align: center;
    color: #888;
	}
</style>

<Nav {segment}/>

<main>
	<slot></slot>
</main>

<footer>
	All content CC-BY-SA
</footer>
