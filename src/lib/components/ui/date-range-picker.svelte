<script lang="ts">
  import {
    DateRangePicker,
    type DateRange,
    type WithoutChildrenOrChild,
  } from "bits-ui";
  import CalendarBlankIcon from "phosphor-svelte/lib/CalendarBlankIcon";
  import CaretLeftIcon from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";

  import { cn } from "$lib/utils/cn";

  type Props = WithoutChildrenOrChild<DateRangePicker.RootProps> & {
    value?: DateRange;
    label?: string;
    class?: string;
  };

  let {
    value = $bindable(),
    label,
    locale = "pl-PL",
    granularity = "day",
    weekdayFormat = "short",
    fixedWeeks = true,
    class: className,
    ...rootProps
  }: Props = $props();

  const mergedRootClass = $derived(
    cn("group flex w-fit max-w-full flex-col gap-1.5", className),
  );
</script>

<DateRangePicker.Root
  bind:value
  {locale}
  {granularity}
  {weekdayFormat}
  {fixedWeeks}
  class={mergedRootClass}
  {...rootProps}
>
  {#if label}
    <DateRangePicker.Label class="block select-none text-sm font-medium text-foreground">
      {label}
    </DateRangePicker.Label>
  {/if}
  <div class="inline-flex h-10 w-fit max-w-full select-none items-center gap-0 rounded-md border border-border-input bg-background px-1.5 py-1 text-sm tabular-nums text-foreground transition-colors hover:border-border-input-hover focus-within:border-border-input-hover focus-within:ring-2 focus-within:ring-foreground/20 group-data-invalid:border-destructive">
    {#each ["start", "end"] as const as type (type)}
      <DateRangePicker.Input {type}>
        {#snippet children({ segments })}
          {#each segments as { part, value: segmentValue }, i (part + i)}
            <span class="inline-flex select-none">
              {#if part === "literal"}
                <DateRangePicker.Segment
                  {part}
                  class="px-0 text-muted-foreground"
                >
                  {segmentValue}
                </DateRangePicker.Segment>
              {:else}
                <DateRangePicker.Segment
                  {part}
                  class="rounded-sm px-0.5 py-0 hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  {segmentValue}
                </DateRangePicker.Segment>
              {/if}
            </span>
          {/each}
        {/snippet}
      </DateRangePicker.Input>
      {#if type === "start"}
        <span aria-hidden="true" class="px-0.5 text-muted-foreground">–</span>
      {/if}
    {/each}
    <DateRangePicker.Trigger class="ms-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground-alt transition-colors hover:bg-muted active:bg-muted/70">
      <CalendarBlankIcon />
    </DateRangePicker.Trigger>
  </div>
  <DateRangePicker.Content sideOffset={6} class="z-50">
    <DateRangePicker.Calendar class="mt-2 rounded-lg border border-border-card bg-background p-4 shadow-popover">
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header class="flex items-center justify-between">
          <DateRangePicker.PrevButton
            class="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted active:bg-muted/70"
          >
            <CaretLeftIcon />
          </DateRangePicker.PrevButton>
          <DateRangePicker.Heading class="text-sm font-medium" />
          <DateRangePicker.NextButton
            class="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted active:bg-muted/70"
          >
            <CaretRightIcon />
          </DateRangePicker.NextButton>
        </DateRangePicker.Header>
        <div class="pt-4">
          {#each months as month (month.value)}
            <DateRangePicker.Grid class="w-full border-collapse select-none">
              <DateRangePicker.GridHead>
                <DateRangePicker.GridRow class="mb-1 flex w-full">
                  {#each weekdays as day (day)}
                    <DateRangePicker.HeadCell
                      class="w-9 text-center text-xs font-normal text-muted-foreground"
                    >
                      {day.slice(0, 2)}
                    </DateRangePicker.HeadCell>
                  {/each}
                </DateRangePicker.GridRow>
              </DateRangePicker.GridHead>
              <DateRangePicker.GridBody>
                {#each month.weeks as weekDates (weekDates)}
                  <DateRangePicker.GridRow class="flex w-full">
                    {#each weekDates as date (date)}
                      <DateRangePicker.Cell
                        {date}
                        month={month.value}
                        class="relative size-9 p-0 text-center"
                      >
                        <DateRangePicker.Day
                          class="relative inline-flex size-9 items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-sm font-normal text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:text-foreground/30 data-disabled:pointer-events-none data-disabled:text-foreground/30 data-highlighted:rounded-none data-highlighted:bg-muted data-outside-month:pointer-events-none data-outside-month:text-foreground/30 data-selected:bg-accent data-selected:font-medium data-selected:text-accent-foreground data-selection-end:rounded-md data-selection-end:bg-accent data-selection-end:font-medium data-selection-end:text-accent-foreground data-selection-start:rounded-md data-selection-start:bg-accent data-selection-start:font-medium data-selection-start:text-accent-foreground data-unavailable:text-muted-foreground data-unavailable:line-through"
                        >
                          {date.day}
                        </DateRangePicker.Day>
                      </DateRangePicker.Cell>
                    {/each}
                  </DateRangePicker.GridRow>
                {/each}
              </DateRangePicker.GridBody>
            </DateRangePicker.Grid>
          {/each}
        </div>
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
