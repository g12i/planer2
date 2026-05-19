<script lang="ts" module>
  import { cva } from "class-variance-authority";

  export const inputWrapperVariants = cva(
    'flex items-center rounded-md border border-border-input bg-background text-sm text-foreground outline-hidden transition-colors focus-visible:border-border-input-hover focus-visible:ring-2 focus-visible:ring-foreground/20 has-[:focus-visible]:border-border-input-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    {
      variants: {
        size: {
          default: "gap-2 px-3 py-2",
          sm: "gap-1.5 px-2 py-1",
        },
      },
      defaultVariants: {
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
      class?: string;
      left?: Snippet;
      right?: Snippet;
    };

  let { size, class: className, left, right, ...rest }: Props = $props();

  const wrapperClass = $derived(cn(inputWrapperVariants({ size }), className));
</script>

<div class={wrapperClass}>
  {#if left}{@render left()}{/if}
  <input
    class="min-w-0 flex-1 bg-transparent placeholder:text-muted-foreground outline-none ring-0"
    {...rest}
  />
  {#if right}{@render right()}{/if}
</div>
