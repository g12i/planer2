<script lang="ts">
  import { Separator, type WithoutChild } from "bits-ui";

  type Props = WithoutChild<Separator.RootProps>;

  let {
    orientation = "horizontal",
    decorative = false,
    ...rest
  }: Props = $props();
</script>

<Separator.Root
  {orientation}
  {decorative}
  class="bg-border-card shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px"
  {...rest}
/>
