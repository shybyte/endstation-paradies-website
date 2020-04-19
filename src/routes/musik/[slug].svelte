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

  export let song;

  let currentTime = 0;
  let currentLine;

  let lines;
  $: lines = song.lrc
    .split('\n')
    .map(line => ({
      time: parseLrcTimeAsSeconds(line),
      text: line.replace(/\[.*?\]/g, '')
    }));

  aPlayerStore.subscribe(aPlayer => {
    if (aPlayer) {
      aPlayer.on('timeupdate', (event) => {
        currentTime = aPlayer.audio.currentTime;
        currentLine = lines.find(((line, i) =>
          !lines[i + 1]
          || lines[i + 1].time > currentTime
        ));
        console.log('timeupdate', aPlayer.audio.currentTime, currentLine);
      });
    }
  });

  function onClickLine(line) {
    $aPlayerStore.seek(line.time);
    $aPlayerStore.play();
    currentLine = line;
  }

</script>

<style>
  .line {
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.5s;
  }

  .line:hover {
    background: #ddd;
  }

  .current-line {
    background: red;
  }
</style>

<svelte:head>
  <title>{song.title}</title>
</svelte:head>

<h1>{song.title}</h1>

<div>
  currentTime: {currentTime}
</div>

<div>
  {#each lines as line}
    <div class="line" class:current-line={line === currentLine} on:click={() => onClickLine(line)}  >
      {line.time}: {line.text}<br/>
    </div>
  {/each}
</div>
