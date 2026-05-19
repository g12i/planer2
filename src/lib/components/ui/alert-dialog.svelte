<script lang="ts">
  import { AlertDialog, type WithoutChild } from "bits-ui";
  import type { VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";

  import Button, { buttonVariants } from "$lib/components/ui/button.svelte";

  type TriggerSnippetProps = {
    props: Record<string, unknown>;
  };

  type Props = WithoutChild<AlertDialog.RootProps> & {
    trigger: Snippet<[TriggerSnippetProps]>;
    title: Snippet;
    description?: Snippet;
    actions?: Snippet;
    cancelLabel?: string;
    confirmLabel?: string;
    confirmVariant?: NonNullable<
      VariantProps<typeof buttonVariants>["variant"]
    >;
    onconfirm?: () => void;
  };

  let {
    open = $bindable(false),
    trigger,
    title,
    description,
    actions,
    cancelLabel = "Anuluj",
    confirmLabel = "Potwierdź",
    confirmVariant = "primary",
    onconfirm,
    ...rootProps
  }: Props = $props();
</script>

<AlertDialog.Root bind:open {...rootProps}>
  <AlertDialog.Trigger>
    {#snippet child({ props })}
      {@render trigger({ props })}
    {/snippet}
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    />
    <AlertDialog.Content
      class="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border-card bg-background p-6 shadow-popover outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg"
    >
      <div class="flex flex-col gap-2 pb-2">
        <AlertDialog.Title class="text-lg font-semibold tracking-tight">
          {@render title()}
        </AlertDialog.Title>
        {#if description}
          <AlertDialog.Description class="text-sm text-foreground-alt">
            {@render description()}
          </AlertDialog.Description>
        {/if}
      </div>
      {#if actions}
        {@render actions()}
      {:else}
        <div class="flex gap-2">
          <AlertDialog.Cancel type="button" class="flex-1">
            {#snippet child({ props })}
              <Button variant="ghost" class="w-full" {...props}>
                {cancelLabel}
              </Button>
            {/snippet}
          </AlertDialog.Cancel>
          <AlertDialog.Action type="button" class="flex-1" onclick={onconfirm}>
            {#snippet child({ props })}
              <Button variant={confirmVariant} class="w-full" {...props}>
                {confirmLabel}
              </Button>
            {/snippet}
          </AlertDialog.Action>
        </div>
      {/if}
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
