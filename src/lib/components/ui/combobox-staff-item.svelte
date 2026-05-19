<script lang="ts">
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";

  import ComboboxItem from "$lib/components/ui/combobox-item.svelte";

  type Props = {
    value: string;
    label: string;
    subtitle?: string | null;
  };

  let {
    value,
    label,
    subtitle = null,
  }: Props = $props();
</script>

<ComboboxItem {value} {label}>
  {#snippet children({ selected })}
    <span class="min-w-0 flex-1 truncate">{label}</span>
    {#if subtitle}
      <span
        class="max-w-[45%] shrink-0 truncate text-xs text-foreground-alt"
      >
        {subtitle}
      </span>
    {/if}
    {#if selected}
      <CheckIcon
        class="size-4 shrink-0 text-foreground-alt"
        weight="bold"
        aria-hidden="true"
      />
    {/if}
  {/snippet}
</ComboboxItem>
