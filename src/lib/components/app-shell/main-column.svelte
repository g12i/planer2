<script lang="ts">
  import { Collapsible } from "bits-ui";
  import SidebarIcon from "phosphor-svelte/lib/SidebarIcon";
  import type { Snippet } from "svelte";

  import Button from "$lib/components/ui/button.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";

  type Props = {
    sidebarOpen: boolean;
    title: Snippet;
    children: Snippet;
    toolbar?: Snippet;
  };

  let { sidebarOpen, title, children, toolbar }: Props = $props();
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col">
  <header class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 px-4">
    <Collapsible.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? "Zwiń panel boczny" : "Rozwiń panel boczny"}
        >
          <SidebarIcon />
        </Button>
      {/snippet}
    </Collapsible.Trigger>
    <div class="flex min-w-0 items-center">
      {@render title()}
    </div>
    {#if toolbar}
      <div class="ml-auto flex min-w-0 flex-1 items-center">
        {@render toolbar()}
      </div>
    {/if}
  </header>

  <ScrollArea>
    <div class="p-6">
      {@render children()}
    </div>
  </ScrollArea>
</div>
