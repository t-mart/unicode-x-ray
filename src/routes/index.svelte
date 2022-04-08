<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import graphemeSplit from 'graphemesplit';

  import { Character } from '$lib/character';
  import Loading from '$lib/loading.svelte';
  import Input from '$lib/input.svelte';
  import type { NormalizationForm } from '$lib/normforms';
  import { UnicodeXRayUrl } from '$lib/urlparams';

  // todo:
  // dark mode

  // test input
  // ÇÅ㴴Z̸̢̨̡̡̢̛̛̛̮̘̦̯̹̬͈͍̠͚͕̯̫̖̟͍͈̦͇͙̜͖̮͔̲̦̥͚̖͓̣͎͉̫͛̽͑̔̈̂̐̔͂͗̆̑̈́̓̍͌̈́̑͗̓̋̇̕͜͜͝͝ͅ👩🏻‍❤️‍💋‍👨🏾

  function getGraphemes(text: string, normalizationForm: NormalizationForm | undefined) {
    let normalized;
    if (normalizationForm !== undefined) {
      normalized = text.normalize(normalizationForm);
    } else {
      normalized = text;
    }
    return graphemeSplit(normalized);
  }

  function getReferenceURL(char: Character) {
    return `https://www.compart.com/en/unicode/${char.toFormattedCodepoint()}`
  }

  let names: Map<number, string> = new Map();
  let isLoading = true;

  let url = UnicodeXRayUrl.fromURL($page.url);
  let text: string = url.text;
  let normalizationForm: NormalizationForm | undefined = url.normalizationForm;
  $: graphemes = getGraphemes(text, normalizationForm);

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

<div class="flex flex-col gap-y-2">
  <h1 class="text-4xl">Unicode X-Ray</h1>

  {#if isLoading}
    <Loading />
  {:else}
    <Input bind:text bind:normalizationForm />
    <ol class="flex flex-col gap-2">
      {#each graphemes as grapheme}
        <ol class="flex gap-2">
          <li
            class="flex text-6xl w-32 h-32 truncate min-w-32 max-w-full justify-center items-center shrink-0"
          >
            {grapheme}
          </li>
          <li class="overflow-auto">
            <ol class="flex gap-2">
              {#each Array.from(grapheme).map((character) => Character.fromString(character)) as char}
                <li
                  class="border-2 border-dashed border-border p-1 flex flex-col w-32 h-32 justify-between items-center shrink-0"
                >
                  <a class="font-mono link" href="{getReferenceURL(char)}">{char.toFormattedCodepoint()}</a>
                  <span class="text-4xl">{char.toFormattedString()}</span>
                  <span
                    title={names.get(char.codepoint)}
                    class="text-xs line-clamp-2 min-w-32 max-w-full text-center underline decoration-dotted"
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
</div>

