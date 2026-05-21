<script lang="ts">
  import { page } from "$app/state";
  import { CalendarDate } from "@internationalized/date";
  import {
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import type { DateRange } from "bits-ui";
  import {
    AVAILABILITY_PREFERENCE,
    DAY_ROWS,
    PREFERENCE_OPTIONS,
    SLOT_ROWS,
  } from "$lib/lecturer-availability-constants";
  import AlertDialog from "$lib/components/ui/alert-dialog.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Chip from "$lib/components/ui/chip.svelte";
  import DateRangePicker from "$lib/components/ui/date-range-picker.svelte";
  import RadioGroup from "$lib/components/ui/radio-group.svelte";
  import { inputWrapperVariants } from "$lib/components/ui/input.svelte";
  import {
    formatIsoDateRange,
    groupConsecutiveIsoDates,
  } from "$lib/date-ranges";
  import {
    deleteLecturerMutationOptions,
    saveLecturerMutationOptions,
  } from "$lib/lecturer-availability-mutations";
  import { lecturerAvailabilityQueries } from "$lib/lecturer-availability-queries";
  import { validateLecturerAvailabilityForm } from "$lib/lecturer-availability-schemas";
  import type { LecturerAvailabilityForm } from "$lib/lecturer-availability-types";
  import { cn } from "$lib/utils/cn";

  const queryClient = useQueryClient();

  const usosId = $derived(page.params.usos_id ?? "");

  const detailQuery = createQuery(() => ({
    ...lecturerAvailabilityQueries.detail(usosId),
    enabled: Boolean(usosId),
  }));

  let formUsosId = $state("");
  let name = $state("");
  let daySaturday = $state<LecturerAvailabilityForm["day_saturday"]>(
    AVAILABILITY_PREFERENCE.neutral,
  );
  let daySunday = $state<LecturerAvailabilityForm["day_sunday"]>(
    AVAILABILITY_PREFERENCE.neutral,
  );
  let slotMorning = $state<LecturerAvailabilityForm["slot_morning"]>(
    AVAILABILITY_PREFERENCE.neutral,
  );
  let slotAfternoon = $state<LecturerAvailabilityForm["slot_afternoon"]>(
    AVAILABILITY_PREFERENCE.neutral,
  );
  let unavailableDates = $state<string[]>([]);
  let notes = $state("");
  let dateRangeValue = $state<DateRange | undefined>(undefined);
  let synced = $state(false);

  const saveMutation = createMutation(() =>
    saveLecturerMutationOptions(queryClient),
  );

  const deleteMutation = createMutation(() =>
    deleteLecturerMutationOptions(queryClient),
  );

  function formValues(): LecturerAvailabilityForm {
    return {
      usos_id: formUsosId.trim(),
      name: name.trim(),
      day_saturday: daySaturday,
      day_sunday: daySunday,
      slot_morning: slotMorning,
      slot_afternoon: slotAfternoon,
      unavailable_dates: unavailableDates,
      notes,
    };
  }

  let autoSaveTimer: ReturnType<typeof setTimeout> | undefined;
  const AUTO_SAVE_DELAY_MS = 500;

  function triggerAutoSave() {
    if (!synced) {
      return;
    }

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const result = validateLecturerAvailabilityForm(formValues());
      if (!result.success) {
        return;
      }

      saveMutation.mutate(formValues());
    }, AUTO_SAVE_DELAY_MS);
  }

  $effect(() => {
    usosId;
    clearTimeout(autoSaveTimer);
    synced = false;
  });

  $effect(() => {
    const initial = detailQuery.data;
    if (!initial) {
      return;
    }

    formUsosId = initial.usos_id;
    name = initial.name;
    daySaturday = initial.day_saturday;
    daySunday = initial.day_sunday;
    slotMorning = initial.slot_morning;
    slotAfternoon = initial.slot_afternoon;
    unavailableDates = [...initial.unavailable_dates];
    notes = initial.notes;
    dateRangeValue = undefined;
    synced = true;
  });

  function expandDateRange(range: DateRange): string[] {
    const start = range.start;
    const end = range.end;
    if (!start || !end) {
      return [];
    }

    const dates: string[] = [];
    let cursor = new CalendarDate(start.year, start.month, start.day);
    const endDate = new CalendarDate(end.year, end.month, end.day);

    while (cursor.compare(endDate) <= 0) {
      dates.push(
        `${String(cursor.year).padStart(4, "0")}-${String(cursor.month).padStart(2, "0")}-${String(cursor.day).padStart(2, "0")}`,
      );
      cursor = cursor.add({ days: 1 });
    }

    return dates;
  }

  function addUnavailableDates() {
    if (!dateRangeValue) {
      return;
    }

    const next = expandDateRange(dateRangeValue);
    if (next.length === 0) {
      return;
    }

    const merged = new Set([...unavailableDates, ...next]);
    unavailableDates = [...merged].sort();
    dateRangeValue = undefined;
    triggerAutoSave();
  }

  function removeUnavailableDateRange(dates: string[]) {
    const remove = new Set(dates);
    unavailableDates = unavailableDates.filter((value) => !remove.has(value));
    triggerAutoSave();
  }

  const unavailableDateRanges = $derived(
    groupConsecutiveIsoDates(unavailableDates),
  );

  const textareaClass = cn(inputWrapperVariants(), "min-h-28 w-full resize-y");
  const formLayoutClass = "mx-auto flex w-full max-w-2xl flex-col gap-8";
</script>

<svelte:head>
  <title>{name || "Dostępność"} | Planer</title>
</svelte:head>

{#if detailQuery.isPending}
  <p class="mx-auto max-w-2xl text-sm text-foreground-alt">Ładowanie…</p>
{:else if detailQuery.isError}
  <p
    class="mx-auto max-w-2xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    role="alert"
  >
    {detailQuery.error.message}
  </p>
{:else if detailQuery.data}
  {#key detailQuery.data.usos_id}
    <div class={formLayoutClass}>
      {#if saveMutation.error}
        <p
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {saveMutation.error.message}
        </p>
      {/if}

      <h1 class="text-2xl font-semibold tracking-tight text-foreground">
        {name}
      </h1>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-foreground">Dni tygodnia</h2>
        <div class="space-y-3">
          <fieldset class="space-y-1">
            <legend class="text-sm text-foreground">{DAY_ROWS[0].label}</legend>
            <RadioGroup
              bind:value={daySaturday}
              items={PREFERENCE_OPTIONS}
              name="day_saturday_display"
              orientation="horizontal"
              onValueChange={triggerAutoSave}
            />
          </fieldset>
          <fieldset class="space-y-1">
            <legend class="text-sm text-foreground">{DAY_ROWS[1].label}</legend>
            <RadioGroup
              bind:value={daySunday}
              items={PREFERENCE_OPTIONS}
              name="day_sunday_display"
              orientation="horizontal"
              onValueChange={triggerAutoSave}
            />
          </fieldset>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-foreground">Czas</h2>
        <div class="space-y-3">
          <fieldset class="space-y-1">
            <legend class="text-sm text-foreground">{SLOT_ROWS[0].label}</legend
            >
            <RadioGroup
              bind:value={slotMorning}
              items={PREFERENCE_OPTIONS}
              name="slot_morning_display"
              orientation="horizontal"
              onValueChange={triggerAutoSave}
            />
          </fieldset>
          <fieldset class="space-y-1">
            <legend class="text-sm text-foreground">{SLOT_ROWS[1].label}</legend
            >
            <RadioGroup
              bind:value={slotAfternoon}
              items={PREFERENCE_OPTIONS}
              name="slot_afternoon_display"
              orientation="horizontal"
              onValueChange={triggerAutoSave}
            />
          </fieldset>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-foreground">Niedostępne daty</h2>
        <div class="flex flex-wrap items-end gap-2">
          <DateRangePicker
            bind:value={dateRangeValue}
            label="Zakres dat"
            class="w-auto"
          />
          <Button type="button" variant="primary" onclick={addUnavailableDates}>
            Dodaj
          </Button>
        </div>
        {#if unavailableDateRanges.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each unavailableDateRanges as range (range.start + range.end)}
              <Chip
                onremove={() => removeUnavailableDateRange(range.dates)}
                removeLabel={`Usuń zakres ${formatIsoDateRange(range)}`}
              >
                {formatIsoDateRange(range)}
              </Chip>
            {/each}
          </div>
        {/if}
      </section>

      <section class="space-y-2">
        <label for="notes" class="text-sm font-semibold text-foreground"
          >Notatki</label
        >
        <textarea
          id="notes"
          class={textareaClass}
          bind:value={notes}
          rows={5}
          onblur={triggerAutoSave}
        ></textarea>
      </section>
    </div>

    <div
      class="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 border-border-card border-t pt-4"
    >
      <div class="flex flex-col gap-2">
        {#if deleteMutation.error}
          <p class="text-sm text-destructive" role="alert">
            {deleteMutation.error.message}
          </p>
        {/if}
        <AlertDialog
          confirmLabel="Usuń"
          confirmVariant="destructive"
          onconfirm={() => deleteMutation.mutate(formUsosId)}
        >
          {#snippet trigger({ props })}
            <Button
              {...props}
              variant="destructive"
              loading={deleteMutation.isPending}
            >
              Usuń dostępność
            </Button>
          {/snippet}
          {#snippet title()}Usunąć dostępność?{/snippet}
          {#snippet description()}
            Rekord dla {name} zostanie trwale usunięty. Tej operacji nie można cofnąć.
          {/snippet}
        </AlertDialog>
      </div>
      <p class="text-sm text-foreground-alt" aria-live="polite">
        {#if saveMutation.isPending}
          Zapisywanie…
        {:else if saveMutation.isError}
          Błąd zapisu
        {:else if saveMutation.isSuccess}
          Zapisano
        {/if}
      </p>
    </div>
  {/key}
{/if}
