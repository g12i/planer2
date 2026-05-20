<script lang="ts">
  import { Tabs, type WithoutChild } from "bits-ui";
  import type { Snippet } from "svelte";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChild<Tabs.ContentProps> & {
    class?: string;
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();

  const mergedClass = $derived(
    cn(
      "flex min-h-0 flex-1 gap-6 outline-hidden focus-visible:outline-hidden",
      className,
    ),
  );
</script>

<Tabs.Content class={mergedClass} {...rest}>
  {@render children()}
</Tabs.Content>
