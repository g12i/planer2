<script lang="ts" module>
  import { cva } from "class-variance-authority";

  export const chipVariants = cva(
    "inline-flex max-w-full items-center rounded-md border border-border-card bg-muted text-sm text-foreground",
    {
      variants: {
        size: {
          default: "min-h-8 gap-1 px-2.5 py-1",
        },
      },
      defaultVariants: {
        size: "default",
      },
    },
  );
</script>

<script lang="ts">
  import XIcon from "phosphor-svelte/lib/XIcon";
  import type { VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";

  import { cn } from "$lib/utils/cn";

  type Props = VariantProps<typeof chipVariants> & {
    class?: string;
    children: Snippet;
    onremove?: () => void;
    removeLabel?: string;
  };

  let {
    size,
    class: className,
    children,
    onremove,
    removeLabel = "Usuń",
  }: Props = $props();

  const mergedClass = $derived(cn(chipVariants({ size }), className));
</script>

<span class={mergedClass}>
  <span class="truncate">{@render children()}</span>
  {#if onremove}
    <button
      type="button"
      class="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-foreground-alt transition-colors hover:bg-background/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:outline-hidden"
      aria-label={removeLabel}
      onclick={onremove}
    >
      <XIcon />
    </button>
  {/if}
</span>
