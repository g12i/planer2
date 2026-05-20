<script lang="ts" module>
  import { cva } from "class-variance-authority";

  export const inputWrapperVariants = cva(
    'flex items-center rounded-md border border-border-input  text-sm text-foreground outline-hidden transition-colors focus-visible:border-border-input-hover focus-visible:ring-2 focus-visible:ring-foreground/20 has-[:focus-visible]:border-border-input-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    {
      variants: {
        variant: {
          default: "bg-background",
          disabled: "bg-muted",
        },
        size: {
          default: "gap-2 px-3 py-2",
          sm: "gap-1.5 px-2 py-1",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );
</script>

<script lang="ts">
  import type { VariantProps } from "class-variance-authority";
  import type { Snippet } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";

  import { cn } from "$lib/utils/cn";

  type Props = SvelteHTMLElements["input"] &
    VariantProps<typeof inputWrapperVariants> & {
      children?: Snippet;
      class?: string;
      left?: Snippet;
      right?: Snippet;
    };

  let {
    children,
    disabled,
    size,
    class: className,
    left,
    right,
    ...rest
  }: Props = $props();

  const wrapperClass = $derived(
    cn(
      inputWrapperVariants({
        size,
        variant: disabled ? "disabled" : "default",
      }),
      "[&_input]:min-w-0 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:placeholder:text-muted-foreground [&_input]:outline-none [&_input]:ring-0",
      className,
    ),
  );
</script>

<div class={wrapperClass}>
  {#if left}{@render left()}{/if}
  {#if children}
    {@render children()}
  {:else}
    <input {disabled} {...rest} />
  {/if}
  {#if right}{@render right()}{/if}
</div>
