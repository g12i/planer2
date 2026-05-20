<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import Combobox from "$lib/components/ui/combobox.svelte";
  import {
    geoBuildingToOption,
    geoRoomToOption,
  } from "$lib/usos-geo-schemas";
  import { usosQueries } from "$lib/usos-queries";

  type Props = {
    roomUsosId?: string | null;
    disabled?: boolean;
  };

  let { roomUsosId = $bindable(null), disabled = false }: Props = $props();

  let buildingId = $state("");
  let buildingInputValue = $state("");
  let buildingSearchQuery = $state("");
  let buildingSyncedFromRoom = $state(false);

  let roomComboboxValue = $state("");
  let roomComboboxInputValue = $state("");
  let selectionSyncedRoomId = $state<string | null>(null);
  let pickedDisplayLabel = $state<string | null>(null);
  let prevBuildingId = $state("");

  const buildingIndexQuery = createQuery(() => usosQueries.buildingIndex());

  const roomDetailQuery = createQuery(() => ({
    ...usosQueries.room(roomUsosId ?? ""),
    enabled: Boolean(roomUsosId),
  }));

  const buildingRoomsQuery = createQuery(() => ({
    ...usosQueries.buildingRooms(buildingId),
    enabled: Boolean(buildingId),
  }));

  $effect(() => {
    const detail = roomDetailQuery.data;
    if (!detail) return;
    if (buildingId === detail.building.id) return;
    buildingId = detail.building.id;
    const option = geoBuildingToOption(detail.building);
    buildingInputValue = option.label;
    buildingSyncedFromRoom = true;
    prevBuildingId = detail.building.id;
  });

  $effect(() => {
    if (buildingId !== prevBuildingId && prevBuildingId && !buildingSyncedFromRoom) {
      roomUsosId = null;
      roomComboboxValue = "";
      roomComboboxInputValue = "";
      pickedDisplayLabel = null;
      selectionSyncedRoomId = null;
    }
    prevBuildingId = buildingId;
    buildingSyncedFromRoom = false;
  });

  const buildingComboboxItems = $derived.by(() => {
    const buildings = buildingIndexQuery.data ?? [];
    const query = buildingSearchQuery.trim().toLowerCase();
    const filtered = query
      ? buildings.filter((b) =>
          geoBuildingToOption(b).label.toLowerCase().includes(query),
        )
      : buildings;
    return filtered.map(geoBuildingToOption);
  });

  const rooms = $derived(buildingRoomsQuery.data?.rooms ?? []);

  const roomComboboxItems = $derived.by(() => {
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

  const roomDisplayLabel = $derived.by(() => {
    if (!roomUsosId) return null;
    const match = rooms.find((room) => room.id === roomUsosId);
    return match?.number ?? pickedDisplayLabel;
  });

  $effect(() => {
    roomComboboxValue = roomUsosId ?? "";
    if (roomUsosId && roomDisplayLabel) {
      roomComboboxInputValue = roomDisplayLabel;
    } else if (!roomUsosId) {
      roomComboboxInputValue = "";
    }
  });

  function handleBuildingInput(value: string) {
    buildingSearchQuery = value;
    buildingInputValue = value;
    buildingId = "";
  }

  function handleRoomInput(value: string) {
    roomComboboxValue = "";
    roomComboboxInputValue = value;
    roomUsosId = null;
    selectionSyncedRoomId = null;
    pickedDisplayLabel = null;
  }

  $effect(() => {
    const next = roomComboboxValue || null;
    if (roomUsosId !== next) {
      roomUsosId = next;
      if (!next) {
        pickedDisplayLabel = null;
        roomComboboxInputValue = "";
      }
    }
  });

  $effect(() => {
    if (!roomUsosId || roomUsosId === selectionSyncedRoomId) return;
    const match = roomComboboxItems.find((item) => item.value === roomUsosId);
    if (match) {
      pickedDisplayLabel = match.label;
      roomComboboxInputValue = match.label;
      selectionSyncedRoomId = roomUsosId;
    }
  });

  const isRoomSearching = $derived(
    Boolean(buildingRoomsQuery.isPending && Boolean(buildingId)),
  );
</script>

<div class="flex gap-2">
  <div class="min-w-0 flex-1">
    <Combobox
      items={buildingComboboxItems}
      bind:value={buildingId}
      bind:inputValue={buildingInputValue}
      placeholder="Budynek..."
      filter={false}
      {disabled}
      searching={buildingIndexQuery.isPending}
      oninput={handleBuildingInput}
    />
  </div>
  <div class="min-w-0 flex-1">
    <Combobox
      items={roomComboboxItems}
      bind:value={roomComboboxValue}
      bind:inputValue={roomComboboxInputValue}
      placeholder={buildingId ? "Sala..." : "Najpierw budynek"}
      filter={true}
      disabled={disabled || !buildingId}
      searching={isRoomSearching}
      oninput={handleRoomInput}
    />
  </div>
</div>
{#if buildingRoomsQuery.isError}
  <p class="text-xs text-destructive">Nie udało się pobrać sal z USOS.</p>
{/if}
