<script lang="ts">
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import XIcon from "phosphor-svelte/lib/XIcon";
  import type { QueryClient } from "@tanstack/svelte-query";

  import Avatar from "$lib/components/ui/avatar.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import {
    formatUsosUserStoredName,
    getUsosPhotoUrl50,
    getUsosUserInitials,
  } from "$lib/usos-users-schemas";
  import { removePlanEditorMutationOptions } from "$lib/plan-sharing-queries";
  import type { PlanSharingMember } from "$lib/plan-sharing-types";
  import { usosQueries } from "$lib/usos-queries";
  import Tooltip from "$lib/components/ui/tooltip.svelte";

  type Props = {
    member: PlanSharingMember;
    planId: string;
    queryClient: QueryClient;
  };

  let { member, planId, queryClient }: Props = $props();

  const userQuery = createQuery(() => ({
    ...usosQueries.user(member.usos_user_id),
  }));

  const removeMutation = createMutation(() =>
    removePlanEditorMutationOptions(queryClient, planId),
  );

  const displayName = $derived(
    userQuery.data
      ? formatUsosUserStoredName(userQuery.data)
      : member.usos_user_id,
  );

  const photoUrl = $derived(
    userQuery.data ? getUsosPhotoUrl50(userQuery.data) : undefined,
  );

  const initials = $derived(getUsosUserInitials(displayName));

  const roleLabel = $derived(
    member.role === "owner" ? "Właściciel" : "Edytujący",
  );

  const canRemove = $derived(member.role !== "owner");
</script>

<li class="flex items-center gap-3 py-2">
  <Avatar size="md" src={photoUrl} alt={displayName} fallback={initials} />
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-foreground">{displayName}</p>
    {#if userQuery.isError}
      <p class="text-xs text-destructive">Nie udało się pobrać profilu USOS.</p>
    {/if}
  </div>
  <span class="shrink-0 text-xs text-foreground-alt">{roleLabel}</span>
  {#if canRemove}
    <Tooltip label="Cofnij dostęp">
      {#snippet trigger(props)}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Usuń dostęp"
          loading={removeMutation.isPending}
          onclick={() => removeMutation.mutate({ user_id: member.user_id })}
          {...props}
        >
          <XIcon />
        </Button>
      {/snippet}
    </Tooltip>
  {/if}
</li>
