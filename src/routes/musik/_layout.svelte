<script>
  import {onMount, onDestroy} from 'svelte';
  import {goto, stores} from '@sapper/app';
  import Visualizer from './Visualizer.svelte';
  import {isWebGlAvailable} from './webgl';

  const {page} = stores();
  import songs from './_songs';

  let aPlayer;
  import {aPlayer as aPlayerStore, audioFrequencies} from './_stores';

  let currentSongIndex = songs.findIndex(it => $page.path.endsWith(it.slug));
  let currentAudioTime = 0;

  let webGlAvailable = true;
  let enableVisualizer = false;
  let visualizerIsFadingOut = false;

  onMount(() => {
    webGlAvailable = isWebGlAvailable()
  });


  function initAPlayer() {
    const audioItems = songs.map(song => ({
      name: song.title,
      artist: 'Endstation Paradies',
      url: `maxsee/${song.file}.mp3`,
      cover: 'maxsee/cover.jpg',
      lrc: `maxsee/${song.file}.lrc`
    }));

    aPlayer = new APlayer({
      container: document.getElementById('aplayer'),
      lrcType: 3,
      audio: audioItems
    });

    const nodes = Array.from(aPlayer.template.listOl.querySelectorAll('.aplayer-list-author'));
    nodes.forEach((node, i) => {
      node.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      node.innerHTML = `<a download href="${audioItems[i].url}" title="Download ${audioItems[i].name}">Download</a>`;
    });


    aPlayerStore.set(aPlayer);
    aPlayer.list.switch(currentSongIndex);

    aPlayer.on('listswitch', (e) => {
      const songPagePath = '/musik/' + songs[e.index].slug;
      if (e.index !== currentSongIndex && $page.path !== songPagePath) {
        goto(songPagePath);
      }
      currentSongIndex = e.index;
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    aPlayer.on('play', (e) => {
      https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
        audioCtx.resume();
      if (currentSongIndex === -1) {
        goto('/musik/' + songs[0].slug);
      }
    });

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaElementSource(aPlayer.audio);
    source.connect(audioCtx.destination);
    source.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    visualizeAudio()

    function visualizeAudio() {
      requestAnimationFrame(visualizeAudio);
      if (!aPlayer.paused) {
        analyser.getByteFrequencyData(dataArray);
        audioFrequencies.set(dataArray);
        currentAudioTime = aPlayer.audio.currentTime;
      }
    }
  }

  page.subscribe(({path}) => {
    const songIndexOfSongPage = songs.findIndex(it => path.endsWith(it.slug));
    if (aPlayer && songIndexOfSongPage >= 0 && currentSongIndex !== songIndexOfSongPage) {
      aPlayer.list.switch(songIndexOfSongPage);
    }
  });

  onDestroy(() => {
    if (aPlayer) {
      aPlayer.pause();
    }
  });

</script>

<style>
  #aplayer {
    margin-bottom: 1em;
  }

  @media (min-width: 800px) {
    .columns {
      display: flex;
      flex-direction: row;
    }

    #aPlayerContainer {
      width: 400px;
      margin-right: 50px;
      position: sticky;
      top: 70px;
    }
  }

  @media (max-width: 800px) {
    .player-column {
      position: sticky;
      top: 70px;
      background: white;
      z-index: 100;
    }

    #aPlayerContainer {
      margin-bottom: 2em;
    }
  }

  /* On top of Visualizer, otherwise you can't click on links. */
  .columns {
    position: relative;
    z-index: 1;
  }

  .visualizer-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    transition: opacity 2s ease;
    opacity: 0;
  }

  .visualizer-container.enabled {
    opacity: 1;
  }

</style>

<svelte:head>
  <link rel="stylesheet" href="libs/aplayer/dist/APlayer.min.css">
  <script src="libs/aplayer/dist/APlayer.min.js" on:load={initAPlayer}></script>
</svelte:head>

<h1>Musik &amp; Texte - Live vom Maxsee</h1>

<div class="visualizer-container" class:enabled={enableVisualizer}
  on:transitionend={visualizerIsFadingOut = false}
>
  {#if enableVisualizer || visualizerIsFadingOut}
    <Visualizer spectrum={$audioFrequencies} currentTime={currentAudioTime}/>
  {/if}
</div>

<div class="columns">
  <div class="column player-column">
    <div id="aPlayerContainer">
      <div id="aplayer"></div>
      {#if webGlAvailable}
        <input
          type="checkbox" id="switch"
          bind:checked={enableVisualizer}
          on:click={(el) => visualizerIsFadingOut = !el.target.checked}
        />
        <label
          for="switch">Psychedelic-Modus</label>
      {:else}
        Installiere einen modernen Browser und ne gute Grafikkarte für den Psychedelic-Modus.
      {/if}
    </div>
  </div>
  <div class="column text-column">
    <slot></slot>
  </div>
</div>

