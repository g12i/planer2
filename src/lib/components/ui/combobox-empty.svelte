<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    children?: Snippet;
  };

  let { children }: Props = $props();
</script>

<span class="block px-3 py-2 text-sm text-muted-foreground">
  {#if children}
    {@render children()}
  {:else}
    Nie znaleziono wyników.
  {/if}
</span>
