<script>
	import { onDestroy } from 'svelte';
	let ap;

	function initAPlayer() {
		ap = new APlayer({
			container: document.getElementById('aplayer'),
			lrcType: 3,
			audio: [
				{
					name: 'System',
					artist: 'Endstation Paradies',
					url: 'maxsee/08 System.mp3',
					cover: 'maxsee/cover.jpg',
					lrc: 'maxsee/08 System.lrc'
				},
				{
					name: 'Wahrheit',
					artist: 'Endstation Paradies',
					url: 'maxsee/07 Wahrheit.mp3',
					cover: 'maxsee/cover.jpg',
					lrc: 'maxsee/07 Wahrheit.lrc'
				}
			]
		});
	}

	onDestroy(() => {
		if (ap) {
			ap.pause();
		}
	});

</script>

<style>
</style>

<svelte:head>
	<link rel="stylesheet" href="libs/aplayer/dist/APlayer.min.css">
	<script src="libs/aplayer/dist/APlayer.min.js" on:load={initAPlayer}></script>
</svelte:head>

<h1>Musik</h1>

<div id="aplayer"></div>

<slot></slot>
