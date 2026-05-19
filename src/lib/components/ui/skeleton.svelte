<script lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";

  import { cn } from "$lib/utils/cn";

  type Props = SvelteHTMLElements["div"] & {
    class?: string;
  };

  let { class: className, ...rest }: Props = $props();
</script>

<div
  class={cn(
    "relative overflow-hidden rounded-md bg-muted before:pointer-events-none before:absolute before:inset-0 before:block before:h-full before:w-full before:animate-skeleton-slide before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent before:content-[''] dark:before:via-foreground/20",
    className,
  )}
  aria-hidden="true"
  {...rest}
></div>
