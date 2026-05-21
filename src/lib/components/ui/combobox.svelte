<script lang="ts">
  import { Combobox, mergeProps, type WithoutChild } from "bits-ui";
  import CaretUpDownIcon from "phosphor-svelte/lib/CaretUpDownIcon";
  import CircleNotchIcon from "phosphor-svelte/lib/CircleNotchIcon";
  import type { Snippet } from "svelte";

  import ComboboxEmpty from "$lib/components/ui/combobox-empty.svelte";
  import ComboboxItem from "$lib/components/ui/combobox-item.svelte";
  import ComboboxStaffItem from "$lib/components/ui/combobox-staff-item.svelte";
  import Input from "$lib/components/ui/input.svelte";

  type ComboboxOption = {
    value: string;
    label: string;
    storedName?: string;
    subtitle?: string | null;
    photoUrl?: string;
  };

  function isStaffOption(item: ComboboxOption): boolean {
    return item.subtitle !== undefined;
  }

  type Props = WithoutChild<
    Omit<Combobox.RootProps, "type" | "items" | "value" | "open" | "inputValue">
  > & {
    value?: string;
    inputValue?: string;
    open?: boolean;
    items: ComboboxOption[];
    placeholder?: string;
    filter?: boolean;
    oninput?: (value: string) => void;
    content?: Snippet<[{ filteredItems: ComboboxOption[] }]>;
    empty?: Snippet;
    searching?: boolean;
    trigger?: Snippet;
  };

  let {
    value = $bindable(),
    inputValue = $bindable(""),
    open = $bindable(false),
    items,
    placeholder,
    filter = true,
    oninput,
    content,
    empty,
    searching = false,
    trigger,
    ...rootProps
  }: Props = $props();

  const filteredItems = $derived.by(() => {
    if (!filter) {
      return items;
    }

    if (inputValue === "") {
      return items;
    }

    const query = inputValue.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(query));
  });

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    oninput?.(event.currentTarget.value);
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    if (!isOpen) {
      const match = items.find((item) => item.value === value);
      inputValue = match?.label ?? "";
    }
  }

  const mergedRootProps = $derived(
    mergeProps(rootProps, {
      onOpenChangeComplete: handleOpenChangeComplete,
    }),
  );
</script>

<Combobox.Root
  type="single"
  {items}
  bind:value
  bind:open
  bind:inputValue
  {...mergedRootProps}
>
  <div class="relative w-full">
    <Input disabled={rootProps.disabled}>
      <Combobox.Input
        class="w-full truncate"
        {placeholder}
        oninput={handleInput}
      />
      {#snippet right()}
        <Combobox.Trigger
          class="text-foreground-alt flex items-center justify-center rounded-md outline-hidden hover:bg-black/4 hover:text-foreground dark:hover:bg-white/4 dark:active:bg-white/8 p-0.5 -m-0.5"
        >
          {#if searching}
            <CircleNotchIcon
              class="size-4 animate-spin text-foreground-alt"
              weight="regular"
              aria-hidden="true"
            />
          {:else if trigger}
            {@render trigger()}
          {:else}
            <CaretUpDownIcon />
          {/if}
        </Combobox.Trigger>
      {/snippet}
    </Input>
  </div>
  <Combobox.Portal>
    <Combobox.Content
      class="border-border-card bg-background shadow-popover z-50 max-h-[var(--bits-combobox-content-available-height)] w-[var(--bits-combobox-anchor-width)] min-w-48 rounded-lg border p-1 outline-hidden"
    >
      <Combobox.Viewport class="max-h-60 p-1">
        {#if content}
          {@render content({ filteredItems })}
        {:else}
          {#each filteredItems as item (item.value)}
            {#if isStaffOption(item)}
              <ComboboxStaffItem
                value={item.value}
                label={item.label}
                subtitle={item.subtitle}
                photoUrl={item.photoUrl}
              />
            {:else}
              <ComboboxItem value={item.value} label={item.label} />
            {/if}
          {:else}
            {#if empty}
              {@render empty()}
            {:else}
              <ComboboxEmpty />
            {/if}
          {/each}
        {/if}
      </Combobox.Viewport>
    </Combobox.Content>
  </Combobox.Portal>
</Combobox.Root>
