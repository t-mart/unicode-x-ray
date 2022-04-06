<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Loading from '../lib/loading.svelte';
  import graphemeSplit from 'graphemesplit';
  import { Character } from '$lib/character';

  // example chinese
  // 您的浏览器属于无痕浏览模式，无法进行正常配置，请您将您的浏览器切换成非无痕浏览模式再进行登录

  // example zalgo
  // Ë̸͇́x̴̗̾a̴̘͗ḿ̸̨p̸̮̃l̵͙͌ë̸͓́

  const normalizationFormOptions = {
    None: undefined,
    NFC: 'NFC',
    NFD: 'NFD',
    NFKC: 'NFKC',
    NFKD: 'NFKD'
  };

  let normalizationForm: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | undefined = undefined;

  let text = $page.url.searchParams.get('t') || '';

  let graphemes: string[] = [];

  function xRay() {
    let normalized = text;
    if (normalizationForm !== undefined) {
      normalized = normalized.normalize(normalizationForm);
    }
    graphemes = graphemeSplit(normalized);
  }


  let names: Map<number, string> = new Map();

  onMount(async () => {
    fetch('/names.json')
      .then((response) => response.json())
      .then((data: [string, string][]) => {
        for (const [codepointStr, name] of data) {
          names.set(Number.parseInt(codepointStr), name);
        }
        names = names; // so svelte sees it.
        xRay();
      });
  });
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<h1 class="text-2xl my-2">Unicode X-Ray</h1>

{#if names.size == 0}
  <Loading />
{:else}
  <div class="flex flex-row">
    <input
      bind:value={text}
      on:input={xRay}
      class="ring-2 rounded my-2 w-full text-4xl"
      placeholder="Enter some text..."
    />
    <select
      bind:value={normalizationForm}
      on:change={xRay}
      class="ring-2 rounded my-2 text-4xl"
    >
      {#each Object.entries(normalizationFormOptions) as nfo}
        <option value={nfo[1]}>
          {nfo[0]}
        </option>
      {/each}
    </select>
  </div>
  <ol class="flex flex-col gap-4 my-2">
    {#each graphemes as grapheme}
      <ol class="flex gap-2">
        <li class="flex flex-col items-center place-content-center text-6xl w-36">{grapheme}</li>
        {#each Array.from(grapheme).map((character) => Character.fromString(character)) as char}
          <li class="border-2 flex flex-col items-center place-content-center w-36">
            <span class="text-center font-mono">{char.toFormattedCodepoint()}</span>
            <span class="text-6xl p-4">{char.toFormattedString()}</span>
            <span class="text-center font-mono text-ellipsis overflow-hidden">
              {names.get(char.codepoint)}
            </span>
          </li>
        {/each}
      </ol>
    {/each}
  </ol>
{/if}
