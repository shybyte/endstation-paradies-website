<script>
  import {onDestroy} from 'svelte';
  import {goto, stores} from '@sapper/app';

  const {page} = stores();
  import songs from './_songs';

  let aPlayer;
  import {aPlayer as aPlayerStore} from './_stores';

  let currentSongIndex = songs.findIndex(it => $page.path.endsWith(it.slug));

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

    aPlayer.on('play', (e) => {
      if (currentSongIndex === -1) {
        goto('/musik/' + songs[0].slug);
      }
    });
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
  @media (min-width: 800px) {
    .columns {
      display: flex;
      flex-direction: row;
    }

    #aplayer {
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

    #aplayer {
      margin-bottom: 2em;
    }
  }

</style>

<svelte:head>
  <link rel="stylesheet" href="libs/aplayer/dist/APlayer.min.css">
  <script src="libs/aplayer/dist/APlayer.min.js" on:load={initAPlayer}></script>
</svelte:head>

<h1>Musik &amp; Texte - Live vom Maxsee</h1>


<div class="columns">
  <div class="column player-column">
    <div id="aplayer"></div>
  </div>
  <div class="column">
    <slot></slot>
  </div>
</div>

