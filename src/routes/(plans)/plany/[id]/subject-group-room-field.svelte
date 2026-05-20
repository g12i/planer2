<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import Combobox from "$lib/components/ui/combobox.svelte";
  import { geoRoomToOption } from "$lib/usos-geo-schemas";
  import { usosQueries } from "$lib/usos-queries";

  type Props = {
    buildingId: string;
    roomUsosId?: string | null;
    disabled?: boolean;
  };

  let {
    buildingId,
    roomUsosId = $bindable(null),
    disabled = false,
  }: Props = $props();

  let comboboxValue = $state("");
  let comboboxInputValue = $state("");
  let selectionSyncedRoomId = $state<string | null>(null);
  let pickedDisplayLabel = $state<string | null>(null);

  const buildingRoomsQuery = createQuery(() => ({
    ...usosQueries.buildingRooms(buildingId),
    enabled: Boolean(buildingId),
  }));

  const rooms = $derived(buildingRoomsQuery.data?.rooms ?? []);

  const comboboxItems = $derived.by(() => {
    const items = rooms.map(geoRoomToOption);
    const id = roomUsosId;
    if (!id || items.some((item) => item.value === id)) {
      return items;
    }

    if (pickedDisplayLabel) {
      return [{ value: id, label: pickedDisplayLabel }, ...items];
    }

    return items;
  });

  const displayLabel = $derived.by(() => {
    if (!roomUsosId) {
      return null;
    }
    const match = rooms.find((room) => room.id === roomUsosId);
    return match?.number ?? pickedDisplayLabel;
  });

  $effect(() => {
    comboboxValue = roomUsosId ?? "";
    if (roomUsosId && displayLabel) {
      comboboxInputValue = displayLabel;
    } else if (!roomUsosId) {
      comboboxInputValue = "";
    }
  });

  function handleComboboxInput(value: string) {
    comboboxValue = "";
    comboboxInputValue = value;
    roomUsosId = null;
    selectionSyncedRoomId = null;
    pickedDisplayLabel = null;
  }

  $effect(() => {
    const next = comboboxValue || null;
    if (roomUsosId !== next) {
      roomUsosId = next;
      if (!next) {
        pickedDisplayLabel = null;
        comboboxInputValue = "";
      }
    }
  });

  $effect(() => {
    if (!roomUsosId || roomUsosId === selectionSyncedRoomId) {
      return;
    }

    const match = comboboxItems.find((item) => item.value === roomUsosId);
    if (match) {
      pickedDisplayLabel = match.label;
      comboboxInputValue = match.label;
      selectionSyncedRoomId = roomUsosId;
    }
  });

  const isSearching = $derived(
    Boolean(buildingRoomsQuery.isPending && Boolean(buildingId)),
  );
</script>

<Combobox
  items={comboboxItems}
  bind:value={comboboxValue}
  bind:inputValue={comboboxInputValue}
  placeholder={buildingId ? "Wybierz salę..." : "Najpierw wybierz budynek"}
  filter={true}
  disabled={disabled || !buildingId}
  searching={isSearching}
  oninput={handleComboboxInput}
/>
{#if buildingRoomsQuery.isError}
  <p class="text-xs text-destructive">Nie udało się pobrać sal z USOS.</p>
{/if}
