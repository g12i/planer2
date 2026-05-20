<script lang="ts">
  import { Tabs, type WithoutChild } from "bits-ui";
  import type { Snippet } from "svelte";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChild<Tabs.TriggerProps> & {
    class?: string;
    children: Snippet;
  };

  let { class: className, children, ...rest }: Props = $props();

  const mergedClass = $derived(
    cn(
      "inline-flex h-8 items-center justify-center rounded-md px-3 py-1 text-foreground-alt transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className,
    ),
  );
</script>

<Tabs.Trigger class={mergedClass} {...rest}>
  {@render children()}
</Tabs.Trigger>
