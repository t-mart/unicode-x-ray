<script lang="ts">
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';

  import { UnicodeXRayUrl } from '$lib/urlparams';
  import { NORMALIZATION_FORMS } from '$lib/normforms';
  import type { NormalizationForm } from '$lib/normforms';

  export let normalizationForm: NormalizationForm | undefined = undefined;
  export let text = '';

  let showCopyToast = false;
  let showDurationMs = 3000;
  let transitionDurationMs: 500;

  async function copy() {
    const copyURL = new UnicodeXRayUrl(text, normalizationForm).toURL($page.url).toString();
    await navigator.clipboard.writeText(copyURL).then(() => {
      console.log(`copied ${copyURL}`);
      if (!showCopyToast) {
        showCopyToast = true;

        setTimeout(() => {
          showCopyToast = false;
        }, showDurationMs);
      }
    });
  }
</script>

<div
  class="
  grid
  grid-cols-narrow-input-layout
  lg:grid-flow-col
  lg:grid-cols-wide-input-layout
  lg:grid-rows-wide-input-layout
  lg:gap-x-4
  gap-y-2"
>
  <label for="text" class="">Text</label>
  <input
    bind:value={text}
    type="text"
    id="text"
    class="form-input text-4xl p-2 placeholder:italic placeholder:text-border w-full"
    placeholder="Enter some text..."
  />

  <div class="whitespace-nowrap">
    <label for="normalization" class="">Normalization</label>
    <a
      href="https://unicode.org/reports/tr15/#Introduction"
      class="link text-xs align-super"
    >
      what's this?
    </a>
  </div>
  <select id="normalization" bind:value={normalizationForm} class="form-input text-4xl p-2">
    <option value={undefined}>None</option>
    {#each NORMALIZATION_FORMS as option}
      <option value={option} selected={option === normalizationForm}>
        {option}
      </option>
    {/each}
  </select>

  <button
    class="lg:row-start-2 place-self-stretch button
    h-full
    w-full
    p-2
    whitespace-nowrap"
    on:click={() => copy()}
  >
    Copy Link
  </button>
</div>

{#if showCopyToast}
  <div
    class="fixed inset-x-0 flex justify-center"
    transition:fly={{ duration: transitionDurationMs, y: -100 }}
  >
    <span
      class="p-4 bg-green-200 border-2 border-green-400 dark:bg-green-800 dark:border-green-600 shadow-lg shadow-stone-300/50 dark:shadow-stone-700/50"
      >Link copied!</span
    >
  </div>
{/if}
