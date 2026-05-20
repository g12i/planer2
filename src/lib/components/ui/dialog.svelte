<script lang="ts">
  import { Dialog, type WithoutChild } from "bits-ui";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import type { Snippet } from "svelte";

  type Props = WithoutChild<Dialog.RootProps> & {
    title: Snippet;
    description?: Snippet;
    children: Snippet;
    actions?: Snippet;
  };

  let {
    open = $bindable(false),
    title,
    description,
    children,
    actions,
    ...rootProps
  }: Props = $props();
</script>

<Dialog.Root bind:open {...rootProps}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border border-border-card bg-background p-6 shadow-popover outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg"
    >
      <div class="flex flex-col gap-2">
        <Dialog.Title class="text-lg font-semibold tracking-tight">
          {@render title()}
        </Dialog.Title>
        {#if description}
          <Dialog.Description class="text-sm text-foreground-alt">
            {@render description()}
          </Dialog.Description>
        {/if}
      </div>

      {@render children()}

      {#if actions}
        {@render actions()}
      {/if}

      <Dialog.Close
        class="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-md text-foreground-alt transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:outline-hidden"
      >
        <XIcon class="size-5" weight="regular" aria-hidden="true" />
        <span class="sr-only">Zamknij</span>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
