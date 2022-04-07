<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import graphemeSplit from 'graphemesplit';

  import { Character } from '$lib/character';
  import Loading from '$lib/loading.svelte';
  import Input from '$lib/input.svelte';
  import type { NormalizationForm } from '$lib/types';


  // test input
  // ÇÅ㴴Z̸̢̨̡̡̢̛̛̛̮̘̦̯̹̬͈͍̠͚͕̯̫̖̟͍͈̦͇͙̜͖̮͔̲̦̥͚̖͓̣͎͉̫͛̽͑̔̈̂̐̔͂͗̆̑̈́̓̍͌̈́̑͗̓̋̇̕͜͜͝͝ͅ👩🏻‍❤️‍💋‍👨🏾

  let text = $page.url.searchParams.get('t') || '';
  let normalizationForm: NormalizationForm;
  $: graphemes = getGraphemes(text, normalizationForm);

  function getGraphemes(text: string, normalizationForm: NormalizationForm) {
    let normalized;
    if (normalizationForm !== undefined) {
      normalized = text.normalize(normalizationForm);
    } else {
      normalized = text;
    }
    return graphemeSplit(normalized);
  }

  let names: Map<number, string> = new Map();
  let isLoading = true;

  onMount(async () => {
    fetch('/names.json')
      .then((response) => response.json())
      .then((data: [string, string][]) => {
        for (const [codepointStr, name] of data) {
          names.set(Number.parseInt(codepointStr), name);
        }
        isLoading = false;
      });
  });
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<h1 class="text-4xl my-2">Unicode X-Ray</h1>

{#if isLoading}
  <Loading />
{:else}
  <Input bind:text bind:normalizationForm />
  <ol class="flex flex-col gap-2">
    {#each graphemes as grapheme}
      <ol class="flex gap-2">
        <li class="flex text-6xl w-32 h-32 truncate min-w-32 max-w-full justify-center items-center shrink-0">
            {grapheme}
        </li>
        <li class="overflow-auto">
          <ol class="flex gap-2">
            {#each Array.from(grapheme).map((character) => Character.fromString(character)) as char}
            <li class="border-2 border-dashed flex flex-col w-32 h-32 justify-evenly items-center shrink-0">
              <span class="font-mono">{char.toFormattedCodepoint()}</span>
              <span class="text-4xl">{char.toFormattedString()}</span>
              <span
                title={names.get(char.codepoint)}
                class="text-xs line-clamp-3 min-w-32 max-w-full text-center underline decoration-dotted"
              >
                {names.get(char.codepoint)}
              </span>
            </li>
          {/each}
          </ol>
        </li>

      </ol>
    {/each}
  </ol>
{/if}
