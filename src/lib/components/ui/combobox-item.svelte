<script lang="ts">
  import { Combobox, type WithoutChild } from "bits-ui";
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";
  import type { Snippet } from "svelte";

  type Props = WithoutChild<Combobox.ItemProps> & {
    children?: Snippet<[{ selected: boolean; highlighted: boolean }]>;
  };

  let {
    children: itemChildren,
    label,
    value,
    ...rest
  }: Props = $props();
</script>

<Combobox.Item
  class="data-highlighted:bg-muted flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground outline-hidden"
  {value}
  {label}
  {...rest}
>
  {#snippet children({ selected, highlighted })}
    {#if itemChildren}
      {@render itemChildren({ selected, highlighted })}
    {:else}
      <span class="flex-1 truncate">{label ?? value}</span>
      {#if selected}
        <CheckIcon
          class="size-4 shrink-0 text-foreground-alt"
          weight="bold"
          aria-hidden="true"
        />
      {/if}
    {/if}
  {/snippet}
</Combobox.Item>
