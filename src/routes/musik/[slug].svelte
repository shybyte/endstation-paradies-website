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

  const MINUTES_FORMAT = new Intl.NumberFormat('en', {minimumIntegerDigits: 2});
  const SECONDS_FORMAT = new Intl.NumberFormat('en', {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function secondsToLrcTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;
    return MINUTES_FORMAT.format(minutes) + ':' + SECONDS_FORMAT.format(remainingSeconds);
  }

</script>

<script>
  import {stores} from '@sapper/app';
  import {onMount} from 'svelte';

  const {page} = stores();
  import {aPlayer as aPlayerStore, audioFrequencies} from './_stores';
  import {BeatAnalyzer} from './beat-analyzer';
  import {tick} from 'svelte';

  export let song;

  let currentTime = 0;
  let currentLine;
  let spotlightElement;
  let beatAnalyzer = new BeatAnalyzer(2);

  let lines;
  $: lines = song.lrc
    .split('\n')
    .map(line => ({
      time: parseLrcTimeAsSeconds(line),
      text: line.replace(/\[.*?\]/g, '')
    }));

  function onTime(newCurrentTime) {
    currentTime = newCurrentTime;

    const newCurrentLine = (lines || []).find(((line, i) =>
        line.time <= currentTime &&
        (!lines[i + 1] || !lines[i + 1].time || lines[i + 1].time > currentTime)
    ));

    setCurrentLine(newCurrentLine);
  }

  async function setCurrentLine(newCurrentLine) {
    if (newCurrentLine === currentLine) {
      return;
    }

    currentLine = newCurrentLine

    await tick();

    if (!currentLine && spotlightElement) {
      spotlightElement.style.width = '0px';
      spotlightElement.style.opacity = '0';
      return;
    }

    const currentLineEl = document.querySelector('.current-line .line-text');
    if (currentLineEl) {
      // See @media (min-width: 800px)  in _layout.svelte
      if (window.innerWidth >= 800) {
        currentLineEl.scrollIntoView({behavior: 'smooth', block: 'center'})
      }
      if (spotlightElement) {
        const paddingX = 10;
        const paddingY = 3;
        spotlightElement.style.opacity = '1';
        spotlightElement.style.left = (currentLineEl.offsetLeft - paddingX) + 'px';
        spotlightElement.style.top = (currentLineEl.offsetTop - paddingY) + 'px';
        spotlightElement.style.width = currentLineEl.clientWidth + 'px';
        spotlightElement.style.height = currentLineEl.clientHeight + 'px';
        spotlightElement.style.padding = `${paddingY}px ${paddingX}px`;
      }
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

  function onClickLine(line) {
    // The additional offset prevents floating point 9.499999999999 seeking problems.
    $aPlayerStore.seek(line.time + 0.001);
    setCurrentLine(line);
  }

  onMount(() => {
    audioFrequencies.subscribe((frequencies) => {
      beatAnalyzer.updateWithFrequencies(frequencies);
      const beats = beatAnalyzer.clampedBeats;
      if (spotlightElement) {
        spotlightElement.style.transform = `scale(${1 + beats[0] / 2}, ${1 + beats[1] / 2})`;
      }
      beatAnalyzer = beatAnalyzer;
    });
  });


  /********************** Begin editMode **********************/

  let editMode = false;
  $: editMode = $page.query.editMode === 'true';

  function getShiftedLineIndex(indexDelta) {
    if (!currentLine) {
      return 0;
    }
    const shiftedLineIndex = lines.indexOf(currentLine) + indexDelta;

    if (!lines[shiftedLineIndex]) {
      return 0;
    }

    return shiftedLineIndex;
  }

  const keyboardHandler = {
    /* Copy to Clipboard */
    c() {
      const lrc = lines.map(line =>
        (line.time ? `[${secondsToLrcTime(line.time)}] ` : '') + line.text.trim()
      ).join('\n');
      navigator.clipboard.writeText(lrc).then(() => {
        console.log('Async: Copying to clipboard was successful!');
      }, err => {
        console.error('Async: Could not copy text: ', err);
      });
    },

    /* Seek Back */
    o() {
      $aPlayerStore.seek($aPlayerStore.audio.currentTime - 5);
    },

    /* Prev Line */
    O() {
      onClickLine(lines[getShiftedLineIndex(-1)])
    },

    /* Pause/Play */
    p() {
      $aPlayerStore.toggle();
      console.log('currentTime:', secondsToLrcTime(currentTime));
    },

    /* Seek forward */
    ü() {
      $aPlayerStore.seek($aPlayerStore.audio.currentTime + 5);
    },

    /* Next Line */
    Ü() {
      onClickLine(lines[getShiftedLineIndex(1)])
    },

    /* Increase time of current line */
    async i() {
      if (currentLine) {
        const index = getShiftedLineIndex(0);
        const changedTime = lines[index].time - 0.1;
        lines[index].time = changedTime;
      }
    },

    /* Increase time of current line */
    async '+'() {
      if (currentLine) {
        const index = getShiftedLineIndex(0);
        const changedTime = lines[index].time + 0.1;
        lines[index].time = changedTime;
        // The additional offset prevents floating point 9.499999999999 seeking problems.
        $aPlayerStore.seek(changedTime + 0.0001);
      }
    },

    /* Set time of next line */
    k() {
      const nextLineIndex = getShiftedLineIndex(1);
      lines[nextLineIndex].time = currentTime;
      console.log(`Set line ${nextLineIndex} to`, lines[nextLineIndex]);
    },

    /* Reload LRC */
    async r() {
      song.lrc = await fetch(song.lrcPath).then(r => r.text());
    }
  }

  function onKeypress(event) {
    if (editMode && event.key in keyboardHandler) {
      keyboardHandler[event.key]();
    }
  }

  function onWheelOnTime(wheelEvent, lineIndex) {
    lines[lineIndex].time = lines[lineIndex].time + wheelEvent.deltaY / 1000;
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

  .line-time {
    font-weight: bold;
    color: #f33;
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
    transition-duration: 0.2s;
    transition-property: left, top, width, height, padding;
  }

  .freq-bar {
    background: red;
    height: 10px;
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

  <!--  {#each beatAnalyzer.smoothedValues as freq, i}-->
<!--    <div class="freq-bar" style="width: {freq + 'px'}">{i}</div>-->
<!--  {/each}-->

<!--  {#each beatAnalyzer.clampedBeats as freq, i}-->
<!--    <div class="freq-bar" style="width: {freq*200 + 'px'}">{i}</div>-->
<!--  {/each}-->


<div class="karaoke-bar">
  <div class="spotlight" bind:this={spotlightElement}/>

  <div class="lines">
    {#each lines as line, i}
      <div
        class="line"
        class:current-line={line === currentLine}
        on:click={() => onClickLine(line)}
      >
        {#if editMode && line.time}
          <span
            class="line-time"
            on:wheel|preventDefault={(ev) =>  onWheelOnTime(ev, i)}
          >{secondsToLrcTime(line.time)}</span>
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


