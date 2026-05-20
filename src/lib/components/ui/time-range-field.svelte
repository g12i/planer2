<script lang="ts">
  import { TimeRangeField, type TimeRange, type WithoutChildrenOrChild } from "bits-ui";
  import type { VariantProps } from "class-variance-authority";

  import { cn } from "$lib/utils/cn";

  import { inputWrapperVariants } from "./input.svelte";

  type Props = WithoutChildrenOrChild<TimeRangeField.RootProps> &
    VariantProps<typeof inputWrapperVariants> & {
      value?: TimeRange;
      label?: string;
      class?: string;
    };

  let {
    value = $bindable(),
    locale = "pl-PL",
    hourCycle = 24,
    granularity = "minute",
    size,
    label,
    class: className,
    ...rootProps
  }: Props = $props();

  const wrapperClass = $derived(
    cn(inputWrapperVariants({ size }), "w-full select-none tabular-nums"),
  );

  const rootClass = $derived(cn("flex w-full flex-col gap-1.5", className));

  const segmentClass =
    "rounded-sm px-0.5 py-0 hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0!";
</script>

<TimeRangeField.Root
  bind:value
  {locale}
  {hourCycle}
  {granularity}
  class={rootClass}
  {...rootProps}
>
  {#if label}
    <TimeRangeField.Label class="text-sm font-medium text-foreground">
      {label}
    </TimeRangeField.Label>
  {/if}
  <div class={wrapperClass}>
    {#each ["start", "end"] as const as type (type)}
      <TimeRangeField.Input {type} class="inline-flex min-w-0 items-center">
        {#snippet children({ segments })}
          {#each segments as { part, value: segmentValue }, i (part + i)}
            {#if part === "dayPeriod"}
              <!-- 24h: no AM/PM -->
            {:else}
              <span class="inline-flex select-none">
                {#if part === "literal"}
                  <TimeRangeField.Segment
                    {part}
                    class="px-0 text-muted-foreground"
                  >
                    {segmentValue}
                  </TimeRangeField.Segment>
                {:else}
                  <TimeRangeField.Segment {part} class={segmentClass}>
                    {segmentValue}
                  </TimeRangeField.Segment>
                {/if}
              </span>
            {/if}
          {/each}
        {/snippet}
      </TimeRangeField.Input>
      {#if type === "start"}
        <span aria-hidden="true" class="px-1 text-muted-foreground">–</span>
      {/if}
    {/each}
  </div>
</TimeRangeField.Root>
