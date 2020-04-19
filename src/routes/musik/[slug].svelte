<script context="module">
  export async function preload({params, query}) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await this.fetch(`musik/${params.slug}.json`);
    const data = await res.json();

    if (res.status === 200) {
      const lrcRes = await this.fetch(`maxsee/${data.file}.lrc`);
      if (lrcRes.status !== 200) {
        this.error(res.status, data.message);
        return;
      }
      const lrcData = await lrcRes.text();
      return {song: {...data, lrc: lrcData}};
    } else {
      this.error(res.status, data.message);
    }
  }

  function parseLrcTimeAsSeconds(line) {
    const timeMatch = line.match(/\[(\d+):(\d+)\.(\d*)\].*/);

    if (!timeMatch) {
      return undefined;
    }

    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    const centiSeconds = parseInt(timeMatch[3]);
    return (minutes * 60 + seconds) + centiSeconds / 100;
  }
</script>

<script>
  import {aPlayer as aPlayerStore} from './_stores';
  import {afterUpdate} from 'svelte';

  export let song;

  let currentTime = 0;
  let currentLine;
  let spotlightElement;

  let lines;
  $: lines = song.lrc
    .split('\n')
    .map(line => ({
      time: parseLrcTimeAsSeconds(line),
      text: line.replace(/\[.*?\]/g, '')
    }));

  function onTime(newCurrentTime) {
    currentTime = newCurrentTime;
    currentLine = lines.find(((line, i) =>
        line.time <= currentTime &&
        (!lines[i + 1] || lines[i + 1].time > currentTime)
    ));
    if (!currentLine) {
      spotlightElement.style.width = '0px';
      spotlightElement.style.opacity = '0';
    }
  }

  aPlayerStore.subscribe(aPlayer => {
    if (aPlayer) {
      aPlayer.on('timeupdate', () => onTime(aPlayer.audio.currentTime));
    }
  });

  afterUpdate(() => {
    const currentLineEl = document.querySelector('.current-line');
    if (currentLineEl) {
      const paddingX = 10;
      const paddingY = 3;
      spotlightElement.style.opacity = '1';
      spotlightElement.style.left = (currentLineEl.offsetLeft - paddingX) + 'px';
      spotlightElement.style.top = (currentLineEl.offsetTop - paddingY) + 'px';
      spotlightElement.style.width = currentLineEl.clientWidth + 'px';
      spotlightElement.style.height = currentLineEl.clientHeight + 'px';
      spotlightElement.style.padding = `${paddingY}px ${paddingX}px`;
      console.log('Show spotlightElement');
    }
  });

  function onClickLine(line) {
    $aPlayerStore.seek(line.time);
    $aPlayerStore.play();
    currentLine = line;
  }

</script>

<style>
  .karaoke-bar {
    position: relative;
  }

  .lines {
    z-index: 10;
    position: relative;
    background-color: rgba(255, 255, 255, 0);
  }

  .line {
    color: #555;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.5s;
  }

  .line:hover {
    text-decoration: underline;
  }

  .current-line {
    color: #000;
  }

  .spotlight {
    z-index: 0;
    background: #f63;
    box-shadow: 0px 0px 5px #f86;
    border-radius: 10px;
    position: absolute;
    transition: all 0.3s;
  }

</style>

<svelte:head>
  <title>{song.title}</title>
</svelte:head>

<h1>{song.title}</h1>

<!--<div>-->
<!--  currentTime: {currentTime}-->
<!--</div>-->


<div class="karaoke-bar">
  <div class="spotlight" bind:this={spotlightElement}/>

  <div class="lines">
    {#each lines as line}
      <div class="line" class:current-line={line === currentLine} on:click={() => onClickLine(line)}>
        {line.text}<br/>
      </div>
    {/each}
  </div>
</div>


