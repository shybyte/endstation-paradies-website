<script>
  import {onDestroy} from 'svelte';
  import {goto, stores} from '@sapper/app';

  const {page} = stores();
  import songs from './_songs';

  let aPlayer;
  import {aPlayer as aPlayerStore} from './_stores';

  let songIndexOfSongPage;
  $: songIndexOfSongPage = songs.findIndex(it => $page.path.endsWith(it.slug));
  let currentSongIndex = songIndexOfSongPage || 0;

  function initAPlayer() {
    aPlayer = new APlayer({
      container: document.getElementById('aplayer'),
      lrcType: 3,
      audio: songs.map(song => ({
        name: song.title,
        artist: 'Endstation Paradies',
        url: `maxsee/${song.file}.mp3`,
        cover: 'maxsee/cover.jpg',
        lrc: `maxsee/${song.file}.lrc`
      }))
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
  }

  $: {
    if (aPlayer && songIndexOfSongPage >= 0 && currentSongIndex !== songIndexOfSongPage) {
      aPlayer.list.switch(songIndexOfSongPage);
    }
  }


  onDestroy(() => {
    if (aPlayer) {
      aPlayer.pause();
    }
  });

</script>

<style>

  @media (min-width: 800px) {
    .columns {
      display: flex;
      flex-direction: row;
    }

    #aplayer {
      width: 400px;
      margin-right: 50px;
    }
  }

  @media (max-width: 800px) {
    #aplayer {
      margin-bottom: 2em;
    }
  }

</style>

<svelte:head>
  <link rel="stylesheet" href="libs/aplayer/dist/APlayer.min.css">
  <script src="libs/aplayer/dist/APlayer.min.js" on:load={initAPlayer}></script>
</svelte:head>

<h1>Musik</h1>

<div class="columns">
  <div class="column">
    <div id="aplayer"></div>
  </div>
  <div class="column">
    <slot></slot>
  </div>
</div>

