<script lang="ts">
  import { enhance } from "$app/forms";
  import Button from "$lib/components/ui/button.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const ERROR_MESSAGES: Record<string, string> = {
    missing_oauth_params: "Brak parametrów autoryzacji. Spróbuj ponownie.",
    oauth_failed: "Logowanie USOS nie powiodło się. Spróbuj ponownie.",
    access_denied:
      "Brak dostępu. Aplikacja jest dostępna dla pracowników uczelni.",
  };

  const displayError = $derived(
    data.error
      ? (ERROR_MESSAGES[data.error] ?? "Wystąpił błąd logowania.")
      : null,
  );
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
  <div
    class="flex w-full max-w-sm -translate-y-[clamp(0.75rem,4svh,2.75rem)] flex-col gap-6"
  >
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-xl font-semibold">Planer</h1>
      <p class="text-sm text-neutral-600">
        Zaloguj się kontem USOS, aby korzystać z aplikacji.
      </p>
    </div>

    {#if displayError}
      <p class="text-center text-sm text-red-600" role="alert">
        {displayError}
      </p>
    {/if}

    <form method="POST" use:enhance>
      <Button type="submit" class="w-full">Zaloguj przez USOS</Button>
    </form>
  </div>
</div>
