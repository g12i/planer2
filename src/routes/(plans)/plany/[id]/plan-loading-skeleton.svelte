<script lang="ts">
  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";

  type Props = {
    user: { displayName: string };
  };

  let { user }: Props = $props();
</script>

<AppShell {user}>
  {#snippet title()}
    <Skeleton class="h-4 w-32" />
  {/snippet}

  {#snippet toolbar()}
    <div class="flex gap-2">
      <Skeleton class="h-7 w-16 rounded-md" />
      <Skeleton class="h-7 w-16 rounded-md" />
    </div>
  {/snippet}

  {#snippet sidebar()}
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="shrink-0 border-border-card border-b px-4 py-2">
        <Skeleton class="h-8 w-full" />
      </div>
      <ScrollArea>
        <div class="space-y-3 px-4 py-3">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-3 w-4/5" />
          <Skeleton class="h-3 w-3/5" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-3 w-2/3" />
        </div>
      </ScrollArea>
    </div>
  {/snippet}

  <div class="space-y-3" aria-busy="true" aria-label="Ładowanie planu">
    <Skeleton class="h-5 w-2/5" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-4/5" />
    <Skeleton class="h-4 w-3/5" />
  </div>
</AppShell>
