<script lang="ts">
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";

  import Avatar from "$lib/components/ui/avatar.svelte";
  import ComboboxItem from "$lib/components/ui/combobox-item.svelte";
  import { getUsosUserInitials } from "$lib/usos-users-schemas";

  type Props = {
    value: string;
    label: string;
    subtitle?: string | null;
    photoUrl?: string;
  };

  let { value, label, subtitle = null, photoUrl }: Props = $props();

  const initials = $derived(getUsosUserInitials(label));
</script>

<ComboboxItem {value} {label}>
  {#snippet children({ selected })}
    <Avatar
      size="sm"
      src={photoUrl}
      alt={label}
      fallback={initials}
      class="mr-2"
    />
    <span class="min-w-0 flex-1 truncate">{label}</span>
    {#if subtitle}
      <span class="max-w-[45%] shrink-0 truncate text-xs text-foreground-alt">
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
