<script context="module">
  export async function preload({params, query}) {
    // the `slug` parameter is available because
    // this file is called [slug].svelte
    const res = await this.fetch(`musik/${params.slug}.json`);
    const data = await res.json();

    if (res.status === 200) {
      const lrcPath = `maxsee/${data.file}.lrc`;
      const lrcRes = await this.fetch(lrcPath);
      if (lrcRes.status !== 200) {
        this.error(res.status, data.message);
        return;
      }
      const lrcData = await lrcRes.text();
      return {song: {...data, lrc: lrcData, lrcPath}};
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

  function secondsToLrcTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    return minutes + ':' + (seconds - minutes * 60).toFixed(2);
  }

</script>

<script>
  import {stores} from '@sapper/app';

  const {page} = stores();
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
    currentLine = (lines || []).find(((line, i) =>
        line.time <= currentTime &&
        (!lines[i + 1] || !lines[i + 1].time || lines[i + 1].time > currentTime)
    ));
    if (!currentLine && spotlightElement) {
      spotlightElement.style.width = '0px';
      spotlightElement.style.opacity = '0';
    }
  }

  function startAnimationFrameLoop(aPlayer) {
    if (aPlayer.audio) {
      onTime(aPlayer.audio.currentTime);
    }
    requestAnimationFrame(() => startAnimationFrameLoop(aPlayer));
  }

  aPlayerStore.subscribe(aPlayer => {
    if (aPlayer) {
      startAnimationFrameLoop(aPlayer);
    }
  });

  afterUpdate(() => {
    const currentLineEl = document.querySelector('.current-line .line-text');
    if (currentLineEl) {
      const paddingX = 10;
      const paddingY = 3;
      spotlightElement.style.opacity = '1';
      spotlightElement.style.left = (currentLineEl.offsetLeft - paddingX) + 'px';
      spotlightElement.style.top = (currentLineEl.offsetTop - paddingY) + 'px';
      spotlightElement.style.width = currentLineEl.clientWidth + 'px';
      spotlightElement.style.height = currentLineEl.clientHeight + 'px';
      spotlightElement.style.padding = `${paddingY}px ${paddingX}px`;
    }
  });

  function onClickLine(line) {
    $aPlayerStore.seek(line.time);
    $aPlayerStore.play();
    currentLine = line;
  }

  /********************** Begin editMode **********************/

  let editMode = false;
  $: editMode = $page.query.editMode === 'true';

  const keyboardHandler = {
    c() {
      const lrc = lines.map(line =>
          (line.time ? `[${secondsToLrcTime(line.time)}] ` : '') + line.text
        ).join('\n');
      navigator.clipboard.writeText(lrc).then(() => {
        console.log('Async: Copying to clipboard was successful!');
      }, err => {
        console.error('Async: Could not copy text: ', err);
      });
    },

    o() {
      $aPlayerStore.seek($aPlayerStore.audio.currentTime - 5);
    },

    p() {
      $aPlayerStore.toggle();
      console.log('currentTime:', secondsToLrcTime(currentTime));
    },

    ü() {
      $aPlayerStore.seek($aPlayerStore.audio.currentTime + 5);
    },

    k() {
      if (!currentLine) {
        console.error("No current line");
        return;
      }
      const nextLineIndex = lines.indexOf(currentLine) + 1;

      if (nextLineIndex >= lines.length) {
        console.error("No next line");
        return;
      }

      lines[nextLineIndex].time = currentTime;
      console.log(`Set line ${nextLineIndex} to`, lines[nextLineIndex]);
    },

    async r() {
      song.lrc = await fetch(song.lrcPath).then(r => r.text());
    }
  }

  function onKeypress(event) {
    if (editMode && event.key in keyboardHandler) {
      keyboardHandler[event.key]();
    }
  }

  /********************** End editMode **********************/

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

  .current-line {
    color: #000;
  }

  .line-text {
    display: inline-block;
  }

  .line-text:hover {
    text-decoration: underline;
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

<svelte:window on:keypress={onKeypress}/>

<h1>{song.title}</h1>

{#if editMode}
  <div>
    currentTime: {currentTime.toFixed(2)} = {secondsToLrcTime(currentTime)}<br/><br/>
  </div>
{/if}


<div class="karaoke-bar">
  <div class="spotlight" bind:this={spotlightElement}/>

  <div class="lines">
    {#each lines as line}
      <div
        class="line"
        class:current-line={line === currentLine}
        on:click={() => onClickLine(line)}
      >
        {#if editMode && line.time}
          {line.time.toFixed(2)}
        {/if}
        <span class="line-text">
          {#if line.text}
            {line.text}
          {:else}
            &nbsp;
          {/if}
        </span>
        <br/>
      </div>
    {/each}
  </div>
</div>


