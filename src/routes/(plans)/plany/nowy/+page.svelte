<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import Checkbox from "$lib/components/ui/checkbox.svelte";
  import Combobox from "$lib/components/ui/combobox.svelte";
  import DatePicker from "$lib/components/ui/date-picker.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import { dateValueToIso } from "$lib/date-ranges";
  import { createPlanMutation } from "$lib/plan-mutations";
  import { planQueries } from "$lib/plan-queries";
  import { planCreateSchema } from "$lib/plan-schemas";
  import type { ProgrammeListItem } from "$lib/plan-types";
  import type { DateValue } from "@internationalized/date";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import { Searcher } from "fast-fuzzy";
  import { untrack } from "svelte";

  const queryClient = useQueryClient();

  let programmeId = $state("");
  let planName = $state("");
  let academicYear = $state(new Date().getFullYear());
  let searchQuery = $state("");
  let selectedSemesters = $state<string[]>([]);
  let startDate = $state<DateValue | undefined>(undefined);
  let endDate = $state<DateValue | undefined>(undefined);
  let lastProgrammeId = $state("");
  let fieldError = $state<string | null>(null);

  const programmesQuery = createQuery(() => planQueries.programmes());

  const {
    mutate: createPlan,
    isPending: isCreating,
    error: createError,
  } = createPlanMutation(queryClient);

  const programmes = $derived(programmesQuery.data ?? []);

  const searcher = $derived(
    new Searcher(programmes, {
      keySelector: (programme: ProgrammeListItem) => [
        programme.name,
        programme.code,
      ],
      threshold: 0.7,
    }),
  );

  const filteredProgrammes = $derived(
    searchQuery.trim() ? searcher.search(searchQuery) : programmes,
  );

  const comboboxItems = $derived(
    filteredProgrammes.map((programme) => ({
      value: programme.id,
      label: `${programme.name} (${programme.code})`,
    })),
  );

  const selectedProgramme = $derived(
    programmes.find((programme) => programme.id === programmeId) ?? null,
  );

  const semesterItems = $derived.by(() => {
    const count = selectedProgramme?.semester_count;
    if (!count) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      return {
        value: String(number),
        label: `Semestr ${number}`,
      };
    });
  });

  const canSubmit = $derived(
    Boolean(programmeId) &&
      planName.trim().length > 0 &&
      academicYear > 0 &&
      Boolean(startDate) &&
      Boolean(endDate) &&
      selectedSemesters.length > 0,
  );

  $effect(() => {
    const id = programmeId;
    if (id === lastProgrammeId) {
      return;
    }

    lastProgrammeId = id;
    selectedSemesters = [];
    startDate = undefined;
    endDate = undefined;
    if (!id) {
      return;
    }

    const programme = untrack(() => programmes.find((item) => item.id === id));
    if (programme) {
      planName = `${programme.name} ${programme.code}`;
    }
  });

  function handleComboboxInput(value: string) {
    searchQuery = value;
    programmeId = "";
    fieldError = null;
  }

  function handleCreate() {
    if (!startDate || !endDate) {
      fieldError = "Podaj datę rozpoczęcia i zakończenia.";
      return;
    }

    const parsed = planCreateSchema.safeParse({
      programme_id: programmeId,
      name: planName.trim(),
      academic_year: academicYear,
      start_date: dateValueToIso(startDate),
      end_date: dateValueToIso(endDate),
      semester_numbers: selectedSemesters.map((value) => Number(value)),
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      fieldError =
        flattened.programme_id?.[0] ??
        flattened.name?.[0] ??
        flattened.academic_year?.[0] ??
        flattened.start_date?.[0] ??
        flattened.end_date?.[0] ??
        flattened.semester_numbers?.[0] ??
        "Uzupełnij formularz.";
      return;
    }

    fieldError = null;
    createPlan(parsed.data);
  }
</script>

<svelte:head>
	<title>Nowy plan | Planer</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8">
  <h1 class="text-2xl font-semibold tracking-tight">Nowy plan</h1>

  {#if createError}
    <p role="alert">{createError.message}</p>
  {/if}

  <section class="flex flex-col gap-2">
    <h2 class="text-sm font-semibold">Program studiów</h2>
    <Combobox
      items={comboboxItems}
      bind:value={programmeId}
      placeholder="Wybierz program..."
      searching={programmesQuery.isPending}
      oninput={handleComboboxInput}
    />
    {#if programmesQuery.isError}
      <p role="alert">Nie udało się pobrać programów studiów.</p>
    {/if}
  </section>

  {#if selectedProgramme}
    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Nazwa planu</h2>
      <Input
        value={planName}
        oninput={(e) => {
          planName = e.currentTarget.value;
        }}
      />
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Rok akademicki</h2>
      <div class="flex items-center gap-1">
        <Input
          type="number"
          value={academicYear}
          oninput={(e) => {
            academicYear = Number(e.currentTarget.value);
          }}
          class="w-28"
        />
        <span class="text-sm text-muted-foreground">/{academicYear + 1}</span>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="text-sm font-semibold">Okres planu</h2>
      <div class="flex flex-wrap gap-6">
        <DatePicker bind:value={startDate} label="Data rozpoczęcia" />
        <DatePicker bind:value={endDate} label="Data zakończenia" />
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <Checkbox
        label="Semestry"
        items={semesterItems}
        bind:value={selectedSemesters}
      />
      {#if fieldError}
        <p role="alert">{fieldError}</p>
      {/if}
    </section>
  {/if}

  <div class="flex justify-end border-border-card border-t pt-4">
    <Button
      variant="primary"
      loading={isCreating}
      disabled={!canSubmit}
      onclick={handleCreate}
    >
      {isCreating ? "Tworzenie…" : "Utwórz plan"}
    </Button>
  </div>
</div>
