<script lang="ts">
  import { Button } from "bits-ui";
  import type { VariantProps } from "class-variance-authority";
  import { cva } from "class-variance-authority";
  import type { Snippet } from "svelte";
  import type { SvelteHTMLElements } from "svelte/elements";

  import { cn } from "$lib/utils/cn";

  export const menuItemVariants = cva(
    'flex shrink-0 rounded-md text-sm transition-all outline-hidden select-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    {
      variants: {
        variant: {
          default: "hover:bg-muted hover:text-foreground active:bg-muted/70",
          active: "bg-accent-foreground text-accent dark:bg-accent dark:text-accent-foreground",
        },
        size: {
          default: "gap-1.5 px-3 py-2",
          icon: "size-10 shrink-0 gap-0 p-0 items-center justify-center",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );

  type Props = Omit<SvelteHTMLElements["button"], "class" | "children"> &
    VariantProps<typeof menuItemVariants> & {
      class?: string;
      children: Snippet;
      href?: string;
      active?: boolean;
    };

  let { size, class: className, children, active, ...rest }: Props = $props();

  const mergedClass = $derived(
    cn(
      menuItemVariants({ variant: active ? "active" : "default", size }),
      className,
    ),
  );
</script>

<Button.Root class={mergedClass} {...rest}>
  {@render children()}
</Button.Root>
