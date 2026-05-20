<script lang="ts">
  import { Tabs, type WithoutChild } from "bits-ui";
  import type { Snippet } from "svelte";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChild<Tabs.ListProps> & {
    class?: string;
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();

  const mergedClass = $derived(
    cn(
      "flex flex-wrap gap-1 rounded-md bg-muted/50 p-1 text-sm font-medium",
      className,
    ),
  );
</script>

<Tabs.List class={mergedClass} {...rest}>
  {@render children()}
</Tabs.List>
