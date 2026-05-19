<script lang="ts">
  import {
    Label,
    RadioGroup,
    type WithoutChildrenOrChild,
    useId,
  } from "bits-ui";

  import { cn } from "$lib/utils/cn";

  type RadioGroupOption = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type Props = WithoutChildrenOrChild<RadioGroup.RootProps> & {
    items: RadioGroupOption[];
    value?: string;
    class?: string;
  };

  let {
    value = $bindable(""),
    items,
    orientation = "horizontal",
    class: className,
    ...rootProps
  }: Props = $props();

  const mergedRootClass = $derived(cn("flex gap-4", className));
</script>


<RadioGroup.Root
  bind:value
  {orientation}
  class={mergedRootClass}
  {...rootProps}
>
  {#each items as item (item.value)}
    {@const id = useId()}
    <div
      class="text-foreground group flex select-none items-center transition-all"
    >
      <RadioGroup.Item
        {id}
        value={item.value}
        disabled={item.disabled}
        class="border-border-input bg-background hover:border-dark-40 data-[state=checked]:border-foreground data-[state=checked]:border-[6px] size-5 shrink-0 cursor-default rounded-full border transition-all duration-100 ease-in-out data-disabled:pointer-events-none data-readonly:pointer-events-none"
      />
      <Label.Root for={id} class={"cursor-default ps-3 text-sm"}>
        {item.label}
      </Label.Root>
    </div>
  {/each}
</RadioGroup.Root>
