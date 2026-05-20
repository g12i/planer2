<script lang="ts">
  import { DatePicker, type WithoutChildrenOrChild } from "bits-ui";
  import type { DateValue } from "@internationalized/date";
  import CalendarBlankIcon from "phosphor-svelte/lib/CalendarBlankIcon";
  import CaretLeftIcon from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";

  type Props = WithoutChildrenOrChild<DatePicker.RootProps> & {
    value?: DateValue;
    label?: string;
  };

  let {
    value = $bindable(),
    label,
    locale = "pl-PL",
    granularity = "day",
    weekdayFormat = "short",
    fixedWeeks = true,
    ...rootProps
  }: Props = $props();
</script>

<div class="group flex w-fit max-w-full flex-col gap-1.5">
  <DatePicker.Root
    bind:value
    {locale}
    {granularity}
    {weekdayFormat}
    {fixedWeeks}
    {...rootProps}
  >
    {#if label}
      <DatePicker.Label
        class="block select-none text-sm font-medium text-foreground"
      >
        {label}
      </DatePicker.Label>
    {/if}
    <div
      class="inline-flex h-10 w-fit max-w-full select-none items-center gap-0 rounded-md border border-border-input bg-background px-1.5 py-1 text-sm tabular-nums text-foreground transition-colors hover:border-border-input-hover focus-within:border-border-input-hover focus-within:ring-2 focus-within:ring-foreground/20 group-data-invalid:border-destructive"
    >
      <DatePicker.Input>
        {#snippet children({ segments })}
          {#each segments as { part, value: segmentValue }, i (part + i)}
            <span class="inline-flex select-none">
              {#if part === "literal"}
                <DatePicker.Segment {part} class="px-0 text-muted-foreground">
                  {segmentValue}
                </DatePicker.Segment>
              {:else}
                <DatePicker.Segment
                  {part}
                  class="rounded-sm px-0.5 py-0 hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  {segmentValue}
                </DatePicker.Segment>
              {/if}
            </span>
          {/each}
        {/snippet}
      </DatePicker.Input>
      <DatePicker.Trigger
        class="ms-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground-alt transition-colors hover:bg-muted active:bg-muted/70"
      >
        <CalendarBlankIcon class="size-4" weight="regular" aria-hidden="true" />
      </DatePicker.Trigger>
    </div>
    <DatePicker.Content sideOffset={6} class="z-50">
      <DatePicker.Calendar
        class="mt-2 rounded-lg border border-border-card bg-background p-4 shadow-popover"
      >
        {#snippet children({ months, weekdays })}
          <DatePicker.Header class="flex items-center justify-between">
            <DatePicker.PrevButton
              class="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted active:bg-muted/70"
            >
              <CaretLeftIcon class="size-5" weight="bold" aria-hidden="true" />
            </DatePicker.PrevButton>
            <DatePicker.Heading class="text-sm font-medium" />
            <DatePicker.NextButton
              class="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted active:bg-muted/70"
            >
              <CaretRightIcon class="size-5" weight="bold" aria-hidden="true" />
            </DatePicker.NextButton>
          </DatePicker.Header>
          <div class="pt-4">
            {#each months as month (month.value)}
              <DatePicker.Grid class="w-full border-collapse select-none">
                <DatePicker.GridHead>
                  <DatePicker.GridRow class="mb-1 flex w-full">
                    {#each weekdays as day (day)}
                      <DatePicker.HeadCell
                        class="w-9 text-center text-xs font-normal text-muted-foreground"
                      >
                        {day.slice(0, 2)}
                      </DatePicker.HeadCell>
                    {/each}
                  </DatePicker.GridRow>
                </DatePicker.GridHead>
                <DatePicker.GridBody>
                  {#each month.weeks as weekDates (weekDates)}
                    <DatePicker.GridRow class="flex w-full">
                      {#each weekDates as date (date)}
                        <DatePicker.Cell
                          {date}
                          month={month.value}
                          class="relative size-9 p-0 text-center"
                        >
                          <DatePicker.Day
                            class="relative inline-flex size-9 items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-sm font-normal text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:text-foreground/30 data-disabled:pointer-events-none data-disabled:text-foreground/30 data-outside-month:pointer-events-none data-outside-month:text-foreground/30 data-selected:bg-accent data-selected:font-medium data-selected:text-accent-foreground data-unavailable:text-muted-foreground data-unavailable:line-through"
                          >
                            {date.day}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      {/each}
                    </DatePicker.GridRow>
                  {/each}
                </DatePicker.GridBody>
              </DatePicker.Grid>
            {/each}
          </div>
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </DatePicker.Root>
</div>
