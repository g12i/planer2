<script lang="ts">
  import { Tabs, type WithoutChild } from "bits-ui";
  import type { Snippet } from "svelte";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChild<Tabs.RootProps> & {
    class?: string;
    children: Snippet;
  };

  let {
    value = $bindable(""),
    class: className,
    children,
    orientation = "horizontal",
    ...rest
  }: Props = $props();

  const mergedClass = $derived(
    cn("flex min-h-0 flex-1 flex-col gap-4", className),
  );
</script>

<Tabs.Root bind:value {orientation} class={mergedClass} {...rest}>
  {@render children()}
</Tabs.Root>
