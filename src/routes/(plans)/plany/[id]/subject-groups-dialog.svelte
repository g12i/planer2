<script lang="ts">
  import {
    createMutation,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";

  import Button from "$lib/components/ui/button.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Separator from "$lib/components/ui/separator.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import TabsContent from "$lib/components/ui/tabs-content.svelte";
  import { updateSubjectGroupsMutationOptions } from "$lib/plan-mutations";
  import { subjectGroupsUpdateSchema } from "$lib/plan-schemas";
  import type { PlanDetailSubject, SubjectGroupsUpdate } from "$lib/plan-types";

  import { formatGroupTitle } from "./plan-group-label";
  import SubjectGroupLecturerField from "./subject-group-lecturer-field.svelte";
  import SubjectGroupRoomField from "./subject-group-room-field.svelte";
  import Tooltip from "$lib/components/ui/tooltip.svelte";

  type DraftGroup = {
    _key: string;
    activity_kind: string;
    hours_total: number;
    group_index: number;
    label: string | null;
    lecturer_usos_id: string | null;
    room_usos_id: string | null;
  };

  type Props = {
    open?: boolean;
    planId: string;
    subject: PlanDetailSubject;
  };

  let { open = $bindable(false), planId, subject }: Props = $props();

  const queryClient = useQueryClient();

  const updateMutation = createMutation(() =>
    updateSubjectGroupsMutationOptions(queryClient, planId),
  );

  let draftGroups = $state<DraftGroup[]>([]);
  let validationError = $state<string | null>(null);
  let activeKindTab = $state("");

  function subjectToDraft(source: PlanDetailSubject): DraftGroup[] {
    return source.groups.map((group) => ({
      _key: group.id,
      activity_kind: group.activity_kind,
      hours_total: group.hours_total,
      group_index: group.group_index,
      label: group.label,
      lecturer_usos_id: group.lecturer_usos_id,
      room_usos_id: group.room_usos_id,
    }));
  }

  $effect(() => {
    if (open) {
      const draft = subjectToDraft(subject);
      draftGroups = draft;
      validationError = null;
      activeKindTab = draft[0]?.activity_kind ?? "";
    }
  });

  const activityKinds = $derived.by(() => {
    const seen = new Set<string>();
    const kinds: string[] = [];
    for (const group of draftGroups) {
      if (!seen.has(group.activity_kind)) {
        seen.add(group.activity_kind);
        kinds.push(group.activity_kind);
      }
    }
    return kinds;
  });

  function groupsForKind(kind: string): DraftGroup[] {
    return draftGroups
      .filter((group) => group.activity_kind === kind)
      .sort((a, b) => a.group_index - b.group_index);
  }

  function countForKind(kind: string): number {
    return draftGroups.filter((group) => group.activity_kind === kind).length;
  }

  function addGroup(kind: string) {
    const sameKind = groupsForKind(kind);
    const maxIndex = Math.max(0, ...sameKind.map((group) => group.group_index));
    const template = sameKind[0];
    draftGroups = [
      ...draftGroups,
      {
        _key: crypto.randomUUID(),
        activity_kind: kind,
        hours_total: template?.hours_total ?? 0,
        group_index: maxIndex + 1,
        label: template?.label ?? null,
        lecturer_usos_id: null,
        room_usos_id: null,
      },
    ];
  }

  function removeGroup(key: string, kind: string) {
    const remaining = draftGroups.filter((group) => group._key !== key);
    const sameKind = remaining
      .filter((group) => group.activity_kind === kind)
      .sort((a, b) => a.group_index - b.group_index);

    for (let index = 0; index < sameKind.length; index++) {
      sameKind[index].group_index = index + 1;
    }

    draftGroups = remaining;
  }

  function draftToPayload(groups: DraftGroup[]): SubjectGroupsUpdate {
    return groups.map((group) => ({
      activity_kind: group.activity_kind,
      hours_total: group.hours_total,
      group_index: group.group_index,
      label: group.label,
      lecturer_usos_id: group.lecturer_usos_id || null,
      room_usos_id: group.room_usos_id || null,
    }));
  }

  function groupTitleForDraft(group: DraftGroup): string {
    return formatGroupTitle(
      {
        id: group._key,
        activity_kind: group.activity_kind,
        hours_total: group.hours_total,
        group_index: group.group_index,
        label: group.label,
        lecturer_usos_id: group.lecturer_usos_id,
        room_usos_id: group.room_usos_id,
      },
      draftGroups.map((draft) => ({
        id: draft._key,
        activity_kind: draft.activity_kind,
        hours_total: draft.hours_total,
        group_index: draft.group_index,
        label: draft.label,
        lecturer_usos_id: draft.lecturer_usos_id,
        room_usos_id: draft.room_usos_id,
      })),
    );
  }

  async function handleSave() {
    const payload = draftToPayload(draftGroups);
    const parsed = subjectGroupsUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      validationError =
        parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.";
      return;
    }

    validationError = null;
    await updateMutation.mutateAsync({
      subjectId: subject.id,
      groups: parsed.data,
    });
    open = false;
  }

  const isPending = $derived(updateMutation.isPending);
</script>

<Dialog bind:open >
  {#snippet title()}
    {subject.module_name}
  {/snippet}

  <div class="flex flex-col gap-3">
    {#if draftGroups.length === 0}
      <p class="text-sm text-foreground-alt">Brak grup zajęć.</p>
    {:else}
      <Tabs bind:value={activeKindTab}>
        <TabsList>
          {#each activityKinds as kind (kind)}
            <TabsTrigger value={kind}>{kind}</TabsTrigger>
          {/each}
        </TabsList>

        {#each activityKinds as kind (kind)}
          <TabsContent value={kind}>
            {@const kindGroups = groupsForKind(kind)}
            <div class="flex flex-col gap-4 w-full">
              {#each kindGroups as group (group._key)}
                <div
                  class="flex flex-col gap-3 px-3 py-3 border border-border-card rounded-md"
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-sm font-medium text-foreground">
                      {groupTitleForDraft(group)}
                    </span>
                    <Tooltip label="Usuń grupę">
                      {#snippet trigger(props)}
                        <Button
                          {...props}
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="shrink-0"
                          aria-label="Usuń grupę"
                          disabled={countForKind(kind) <= 1 || isPending}
                          onclick={() => removeGroup(group._key, kind)}
                        >
                          <XIcon />
                        </Button>
                      {/snippet}
                    </Tooltip>
                  </div>

                  <div class="flex flex-col gap-1">
                    <label
                      for="hours-{group._key}"
                      class="text-xs text-foreground-alt"
                    >
                      Godziny
                    </label>
                    <Input
                      id="hours-{group._key}"
                      type="number"
                      min="0"
                      step="1"
                      class="w-24 tabular-nums"
                      disabled={isPending}
                      value={String(group.hours_total)}
                      oninput={(event) => {
                        const raw = event.currentTarget.value;
                        const parsed = Number.parseInt(raw, 10);
                        const hours = Number.isNaN(parsed) ? 0 : parsed;
                        draftGroups = draftGroups.map((draft) =>
                          draft._key === group._key
                            ? { ...draft, hours_total: hours }
                            : draft,
                        );
                      }}
                    />
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-foreground-alt">
                      Prowadzący
                    </span>
                    <div class="min-w-0">
                      {#key group._key}
                        <SubjectGroupLecturerField
                          bind:lecturerUsosId={group.lecturer_usos_id}
                          disabled={isPending}
                        />
                      {/key}
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-foreground-alt">Sala</span>
                    <div class="min-w-0">
                      {#key group._key}
                        <SubjectGroupRoomField
                          bind:roomUsosId={group.room_usos_id}
                          disabled={isPending}
                        />
                      {/key}
                    </div>
                  </div>
                </div>
              {/each}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onclick={() => addGroup(kind)}
              >
                <PlusIcon />
                Dodaj grupę
              </Button>
            </div>
          </TabsContent>
        {/each}
      </Tabs>
    {/if}

    {#if validationError}
      <p role="alert" class="text-xs text-destructive">{validationError}</p>
    {/if}

    {#if updateMutation.isError}
      <p role="alert" class="text-xs text-destructive">
        {updateMutation.error.message}
      </p>
    {/if}
  </div>

  {#snippet actions()}
    <Separator />
    <div class="flex justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onclick={() => {
          open = false;
        }}
      >
        Anuluj
      </Button>
      <Button
        type="button"
        variant="primary"
        loading={updateMutation.isPending}
        disabled={isPending || draftGroups.length === 0}
        onclick={handleSave}
      >
        Zapisz
      </Button>
    </div>
  {/snippet}
</Dialog>
