<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import Combobox from "$lib/components/ui/combobox.svelte";
  import { usosQueries } from "$lib/usos-queries";
  import {
    formatUsosUserStoredName,
    usosSearchItemToOption,
  } from "$lib/usos-users-schemas";

  type Props = {
    lecturerUsosId?: string | null;
    disabled?: boolean;
  };

  let { lecturerUsosId = $bindable(null), disabled = false }: Props = $props();

  let comboboxValue = $state("");
  let comboboxInputValue = $state("");
  let searchQuery = $state("");
  let debouncedSearch = $state("");
  let selectionSyncedUsosId = $state<string | null>(null);
  let pickedDisplayLabel = $state<string | null>(null);

  const userQuery = createQuery(() => ({
    ...usosQueries.user(lecturerUsosId as string),
    enabled: Boolean(lecturerUsosId),
  }));

  const displayLabel = $derived.by(() => {
    if (userQuery.data) {
      return formatUsosUserStoredName(userQuery.data);
    }
    return pickedDisplayLabel;
  });

  $effect(() => {
    comboboxValue = lecturerUsosId ?? "";
    if (lecturerUsosId && displayLabel) {
      comboboxInputValue = displayLabel;
    } else if (!lecturerUsosId) {
      comboboxInputValue = "";
    }
  });

  $effect(() => {
    const query = searchQuery;
    const handle = window.setTimeout(() => {
      debouncedSearch = query;
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  });

  const staffSearchQuery = createQuery(() => ({
    ...usosQueries.staffSearch(debouncedSearch),
    enabled: debouncedSearch.trim().length >= 2,
  }));

  const comboboxItems = $derived.by(() => {
    const items = staffSearchQuery.data ?? [];
    const id = lecturerUsosId;
    if (!id || items.some((item) => item.value === id)) {
      return items;
    }

    if (userQuery.data) {
      return [usosSearchItemToOption({ user: userQuery.data }), ...items];
    }

    if (displayLabel) {
      return [
        {
          value: id,
          label: displayLabel,
          storedName: displayLabel,
          subtitle: null,
        },
        ...items,
      ];
    }

    return items;
  });

  function handleComboboxInput(value: string) {
    searchQuery = value;
    comboboxValue = "";
    comboboxInputValue = value;
    lecturerUsosId = null;
    selectionSyncedUsosId = null;
    pickedDisplayLabel = null;
  }

  $effect(() => {
    const next = comboboxValue || null;
    if (lecturerUsosId !== next) {
      lecturerUsosId = next;
      if (!next) {
        pickedDisplayLabel = null;
        comboboxInputValue = "";
      }
    }
  });

  $effect(() => {
    if (!lecturerUsosId || lecturerUsosId === selectionSyncedUsosId) {
      return;
    }

    const match = comboboxItems.find((item) => item.value === lecturerUsosId);
    if (match) {
      pickedDisplayLabel = match.storedName ?? match.label;
      comboboxInputValue = match.label;
      selectionSyncedUsosId = lecturerUsosId;
    }
  });

  const isSearching = $derived(
    Boolean(
      (staffSearchQuery.isPending && debouncedSearch.trim().length >= 2) ||
        (userQuery.isPending && Boolean(lecturerUsosId)),
    ),
  );
</script>

<Combobox
  items={comboboxItems}
  bind:value={comboboxValue}
  bind:inputValue={comboboxInputValue}
  placeholder="Szukaj prowadzącego..."
  filter={false}
  {disabled}
  searching={isSearching}
  oninput={handleComboboxInput}
/>
{#if staffSearchQuery.isError}
  <p class="text-xs text-destructive">Nie udało się wyszukać w USOS.</p>
{/if}
{#if userQuery.isError && lecturerUsosId}
  <p class="text-xs text-destructive">Nie udało się pobrać prowadzącego z USOS.</p>
{/if}
