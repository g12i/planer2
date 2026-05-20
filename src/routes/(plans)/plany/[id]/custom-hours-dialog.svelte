<script lang="ts">
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import type { TimeRange } from "bits-ui";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";
  import XIcon from "phosphor-svelte/lib/XIcon";

  import Button from "$lib/components/ui/button.svelte";
  import Dialog from "$lib/components/ui/dialog.svelte";
  import Separator from "$lib/components/ui/separator.svelte";
  import TimeRangeField from "$lib/components/ui/time-range-field.svelte";
  import { formatIsoDayLabel } from "$lib/date-ranges";
  import { upsertDayLayoutMutationOptions } from "$lib/plan-mutations";
  import { dayLayoutUpsertSchema } from "$lib/plan-schemas";
  import type { DayLayoutSlot } from "$lib/plan-types";

  import { slotsToTimeRanges, timeRangeToSlot } from "./plan-day-slots";

  type Props = {
    open?: boolean;
    planId: string;
    planSemesterId: string;
    date: string;
    initialSlots: DayLayoutSlot[];
  };

  let {
    open = $bindable(false),
    planId,
    planSemesterId,
    date,
    initialSlots,
  }: Props = $props();

  const queryClient = useQueryClient();

  const upsertMutation = createMutation(() =>
    upsertDayLayoutMutationOptions(queryClient, planId),
  );

  let draftSlots = $state<TimeRange[]>([]);
  let validationError = $state<string | null>(null);

  $effect(() => {
    if (open) {
      draftSlots = slotsToTimeRanges(initialSlots);
      validationError = null;
    }
  });

  function addSlot() {
    draftSlots = [...draftSlots, { start: undefined, end: undefined }];
  }

  function removeSlot(index: number) {
    draftSlots = draftSlots.filter((_, i) => i !== index);
  }

  function buildSlotsPayload(): DayLayoutSlot[] | null {
    const slots: DayLayoutSlot[] = [];
    for (const range of draftSlots) {
      const slot = timeRangeToSlot(range);
      if (!slot) {
        return null;
      }
      slots.push(slot);
    }
    return slots;
  }

  async function handleSave() {
    const slots = buildSlotsPayload();
    if (!slots) {
      validationError = "Uzupełnij wszystkie przedziały (Od i Do).";
      return;
    }

    const parsed = dayLayoutUpsertSchema.safeParse({
      date,
      plan_semester_id: planSemesterId,
      slots,
    });

    if (!parsed.success) {
      validationError =
        parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.";
      return;
    }

    validationError = null;
    await upsertMutation.mutateAsync(parsed.data);
    open = false;
  }

  const isPending = $derived(upsertMutation.isPending);
</script>

<Dialog bind:open>
  {#snippet title()}
    Godziny — {formatIsoDayLabel(date)}
  {/snippet}

  {#snippet description()}
    Każdy przedział to jedna komórka planu. Pojemność liczona jak w informatorze:
    45 min zegarowych = 1 godz. zajęć (np. 08:00–10:15 to 3 godz. zajęć).
  {/snippet}

  <div class="flex flex-col gap-3">
    {#each draftSlots as range, index (index)}
      <div class="flex items-center gap-2">
        <TimeRangeField bind:value={draftSlots[index]} class="min-w-0 flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Usuń przedział"
          disabled={draftSlots.length <= 1 || isPending}
          onclick={() => removeSlot(index)}
        >
          <XIcon class="size-4" weight="regular" />
        </Button>
      </div>
    {/each}

    <Button
      type="button"
      variant="ghost"
      class="w-full justify-center"
      disabled={isPending}
      onclick={addSlot}
    >
      <PlusIcon class="size-4" weight="regular" />
      Dodaj przedział
    </Button>

    {#if validationError}
      <p role="alert" class="text-sm text-destructive">{validationError}</p>
    {/if}
  </div>

  {#snippet actions()}
    <Separator />
    <div class="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        class="flex-1"
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
        class="flex-1"
        loading={upsertMutation.isPending}
        disabled={isPending}
        onclick={handleSave}
      >
        Zapisz
      </Button>
    </div>
  {/snippet}
</Dialog>
