<script lang="ts">
  import {
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import Button from "$lib/components/ui/button.svelte";
  import Combobox from "$lib/components/ui/combobox.svelte";
  import { createLecturerMutation } from "$lib/lecturer-availability-mutations";
  import { lecturerAvailabilityCreateSchema } from "$lib/lecturer-availability-schemas";
  import { searchUsosStaff } from "$lib/usos-search";

  const queryClient = useQueryClient();

  let usosId = $state("");
  let name = $state("");
  let searchQuery = $state("");
  let debouncedSearch = $state("");
  let selectionSyncedUsosId = $state<string | null>(null);
  let fieldError = $state<string | null>(null);

  const {
    mutate: createLecturerAvailability,
    isPending: isCreating,
    error: createError,
  } = createLecturerMutation(queryClient);

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
    queryKey: ["usos-staff-search", debouncedSearch],
    queryFn: () => searchUsosStaff(debouncedSearch),
    enabled: debouncedSearch.trim().length >= 2,
  }));

  const comboboxItems = $derived(staffSearchQuery.data ?? []);

  function handleComboboxInput(value: string) {
    searchQuery = value;
    usosId = "";
    selectionSyncedUsosId = null;
    name = value;
    fieldError = null;
  }

  $effect(() => {
    if (!usosId || usosId === selectionSyncedUsosId) {
      return;
    }

    const match = staffSearchQuery.data?.find((item) => item.value === usosId);
    if (match?.storedName) {
      name = match.storedName;
      selectionSyncedUsosId = usosId;
    }
  });

  function handleCreate() {
    const parsed = lecturerAvailabilityCreateSchema.safeParse({
      usos_id: usosId.trim(),
      name: name.trim(),
    });
    if (!parsed.success) {
      fieldError =
        parsed.error.flatten().fieldErrors.usos_id?.[0] ??
        parsed.error.flatten().fieldErrors.name?.[0] ??
        "Wybierz pracownika z listy.";
      return;
    }

    fieldError = null;
    createLecturerAvailability(parsed.data);
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
  <h1 class="text-2xl font-semibold tracking-tight text-foreground">
    Nowa dostępność
  </h1>

  {#if createError}
    <p
      class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {createError.message}
    </p>
  {/if}

  <section class="space-y-2">
    <h2 class="text-sm font-semibold text-foreground">Imię i nazwisko</h2>
    <Combobox
      items={comboboxItems}
      bind:value={usosId}
      placeholder="Szukaj pracownika..."
      filter={false}
      searching={Boolean(
        staffSearchQuery.isPending && debouncedSearch.trim().length >= 2,
      )}
      oninput={handleComboboxInput}
      aria-invalid={Boolean(fieldError)}
    />
    {#if fieldError}
      <p class="text-xs text-destructive">{fieldError}</p>
    {/if}
    {#if staffSearchQuery.isError}
      <p class="text-xs text-destructive">Nie udało się wyszukać w USOS.</p>
    {/if}
  </section>
</div>

<div
  class="mx-auto flex w-full max-w-2xl justify-end border-border-card border-t pt-4"
>
  <Button
    variant="primary"
    loading={isCreating}
    disabled={!usosId}
    onclick={handleCreate}
  >
    {isCreating ? "Tworzenie…" : "Utwórz"}
  </Button>
</div>
