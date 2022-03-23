<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { xRayText } from '../lib/xray';
  import Loading from '../lib/loading.svelte';
  import type { CodepointEntry, CodepointValue } from '../../generate/types';

  let text = $page.url.searchParams.get('t') || '';

  let codepoints: Map<number, CodepointValue> | null = null;
  //   $: ready = false && codepoints !== null;
  $: ready = codepoints !== null;

  onMount(async () => {
    const start = performance.now();
    fetch('/characters.json')
      .then((response) => response.json())
      .then((data: CodepointEntry[]) => {
        codepoints = new Map(data);
        console.log(`codepoints loaded in ${performance.now() - start}ms`);
      })
      .catch((error) => {
        console.log(error);
        return [];
      });
  });
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<h1 class="text-2xl my-2">Unicode X-Ray</h1>
{#if !ready}
  <Loading />
{:else}
  <input bind:value={text} class="ring-2 rounded my-2 w-full text-4xl"/>
  <ol class="flex flex-col gap-4 my-2">
    {#each xRayText(text, codepoints) as group}
      <ol class="flex gap-2">
        {#each group as cp}
          <li class="border-2 flex flex-col items-center w-24">
            <span class="text-6xl">{cp.toString()}</span>
            <span class="text-center font-mono">{cp.codepointFormatted()}</span>
            <span class="text-center font-mono">{cp.name}</span>
          </li>
        {/each}
      </ol>
    {/each}
  </ol>
{/if}
