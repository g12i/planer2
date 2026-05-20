<script lang="ts">
  import { Tooltip, type WithoutChild } from "bits-ui";
  import type { Snippet } from "svelte";

  type Props = WithoutChild<Tooltip.RootProps> & {
    label: string;
    trigger: Snippet<[Record<string, unknown>]>;
    side?: WithoutChild<Tooltip.ContentProps>["side"];
    sideOffset?: number;
  };

  let {
    label,
    trigger,
    side = "right",
    sideOffset = 8,
    ...rootProps
  }: Props = $props();
</script>

<Tooltip.Root {...rootProps}>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      {@render trigger(props)}
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content
      {side}
      {sideOffset}
      class="z-60 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--bits-tooltip-content-transform-origin)"
    >
      <div
        class="rounded-md border border-transparent bg-neutral-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-popover"
      >
        {label}
      </div>
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
