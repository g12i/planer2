<script lang="ts">
  import { Checkbox, Label, type WithoutChildrenOrChild, useId } from "bits-ui";
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";

  type CheckboxOption = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type Props = WithoutChildrenOrChild<Checkbox.GroupProps> & {
    items: readonly CheckboxOption[];
    value?: string[];
    label?: string;
  };

  let { value = $bindable([]), items, label, ...groupProps }: Props = $props();
</script>

<Checkbox.Group bind:value class="flex flex-col gap-3" {...groupProps}>
  {#if label}
    <Checkbox.GroupLabel class="text-sm font-medium text-foreground">
      {label}
    </Checkbox.GroupLabel>
  {/if}
  {#each items as item (item.value)}
    {@const id = useId()}
    <div class="flex items-center">
      <Checkbox.Root
        {id}
        value={item.value}
        disabled={item.disabled}
        aria-labelledby="{id}-label"
        class="border-border-input bg-background hover:border-dark-40 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground peer inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-md border transition-all duration-150 ease-in-out active:scale-[0.98] data-disabled:pointer-events-none data-readonly:pointer-events-none"
      >
        {#snippet children({ checked })}
          <span class="inline-flex items-center justify-center text-background">
            {#if checked}
              <CheckIcon />
            {/if}
          </span>
        {/snippet}
      </Checkbox.Root>
      <Label.Root
        id="{id}-label"
        for={id}
        class="cursor-default ps-3 text-sm text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {item.label}
      </Label.Root>
    </div>
  {/each}
</Checkbox.Group>
