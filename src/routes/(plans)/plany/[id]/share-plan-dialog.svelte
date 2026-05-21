<script lang="ts">
  import {
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";

  import Combobox from "$lib/components/ui/combobox.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import {
    addPlanEditorMutationOptions,
    planSharingQueries,
  } from "$lib/plan-sharing-queries";
  import { usosQueries } from "$lib/usos-queries";
  import SharePlanMember from "./share-plan-member.svelte";

  type Props = {
    planId: string;
    open?: boolean;
  };

  let { planId, open = $bindable(false) }: Props = $props();

  const queryClient = useQueryClient();

  let searchQuery = $state("");
  let debouncedSearch = $state("");
  let comboboxValue = $state<string | undefined>(undefined);
  let comboboxInputValue = $state("");
  let addingUsosId = $state<string | null>(null);

  const sharingQuery = createQuery(() => ({
    ...planSharingQueries.list(planId),
    enabled: Boolean(planId) && open,
  }));

  const addMutation = createMutation(() =>
    addPlanEditorMutationOptions(queryClient, planId),
  );

  const staffSearchQuery = createQuery(() => ({
    ...usosQueries.staffSearch(debouncedSearch, "current_staff"),
    enabled: open && debouncedSearch.trim().length >= 2,
  }));

  const sharedUsosIds = $derived(
    new Set((sharingQuery.data?.members ?? []).map((m) => m.usos_user_id)),
  );

  const comboboxItems = $derived(
    (staffSearchQuery.data ?? []).filter(
      (item) => !sharedUsosIds.has(item.value),
    ),
  );

  $effect(() => {
    if (!open) {
      comboboxValue = undefined;
      comboboxInputValue = "";
      searchQuery = "";
      debouncedSearch = "";
      addingUsosId = null;
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

  async function handleAddEditor(usosUserId: string) {
    if (addingUsosId === usosUserId) {
      return;
    }
    addingUsosId = usosUserId;
    try {
      await addMutation.mutateAsync({ usos_user_id: usosUserId });
      comboboxValue = undefined;
      comboboxInputValue = "";
      searchQuery = "";
      debouncedSearch = "";
    } catch {
      // mutation error surfaced via addMutation.isError if needed
    } finally {
      addingUsosId = null;
    }
  }

  $effect(() => {
    const value = comboboxValue;
    if (!value || !open) {
      return;
    }
    void handleAddEditor(value);
  });
</script>

<Dialog bind:open size="default">
  {#snippet title()}
    Udostępnij plan
  {/snippet}

  {#snippet children()}
    <div class="flex flex-col gap-4">
      <Combobox
        bind:value={comboboxValue}
        bind:inputValue={comboboxInputValue}
        items={comboboxItems}
        placeholder="Dodaj osoby…"
        filter={false}
        disabled={addMutation.isPending}
        searching={staffSearchQuery.isPending &&
          debouncedSearch.trim().length >= 2}
        oninput={(value) => {
          searchQuery = value;
        }}
      />

      {#if addMutation.isError}
        <p class="text-sm text-destructive" role="alert">
          Nie udało się udostępnić planu.
        </p>
      {/if}

      {#if staffSearchQuery.isError}
        <p class="text-sm text-destructive" role="alert">
          Nie udało się wyszukać w USOS.
        </p>
      {/if}

      <div>
        <h3 class="mb-1 text-xs font-medium text-foreground-alt">
          Osoby z dostępem
        </h3>
        {#if sharingQuery.isPending}
          <p class="text-sm text-foreground-alt">Ładowanie…</p>
        {:else if sharingQuery.isError}
          <p class="text-sm text-destructive" role="alert">
            Nie udało się pobrać listy dostępu.
          </p>
        {:else if (sharingQuery.data?.members ?? []).length === 0}
          <p class="text-sm text-foreground-alt">Brak udostępnień</p>
        {:else}
          <ul class="divide-y divide-border-card">
            {#each sharingQuery.data?.members ?? [] as member (member.user_id)}
              <SharePlanMember {member} {planId} {queryClient} />
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/snippet}
</Dialog>
