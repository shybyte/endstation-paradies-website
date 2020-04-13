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
</script>

<script>
  export let song;
  $: lines = song.lrc
    .split('\n')
    .map(line => line.replace(/\[.*?\]/g, ''));
</script>

<style>
</style>

<svelte:head>
  <title>{song.title}</title>
</svelte:head>

<h1>{song.title}</h1>

<div>
  {#each lines as line, i}
    <div>{line}<br/></div>
  {/each}
</div>
