<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import { lecturerAvailabilityQueries } from "$lib/lecturer-availability-queries";

  const listQuery = createQuery(() => lecturerAvailabilityQueries.list());

  const lecturers = $derived(listQuery.data ?? []);
</script>

<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
  <p class="max-w-md text-sm text-foreground-alt">
    {#if lecturers.length === 0}
      Brak zapisów dostępności. Dodaj pierwszą dostępność prowadzącego.
    {:else}
      Wybierz prowadzącego z listy lub dodaj nową dostępność.
    {/if}
  </p>
</div>
