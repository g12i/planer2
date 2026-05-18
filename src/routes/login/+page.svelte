<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ERROR_MESSAGES: Record<string, string> = {
		missing_oauth_params: 'Brak parametrów autoryzacji. Spróbuj ponownie.',
		oauth_failed: 'Logowanie USOS nie powiodło się. Spróbuj ponownie.',
		access_denied:
			'Brak dostępu. Aplikacja jest dostępna dla pracowników uczelni.',
	};

	const displayError = $derived(
		data.error
			? (ERROR_MESSAGES[data.error] ?? 'Wystąpił błąd logowania.')
			: null,
	);
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<div class="flex flex-col items-center gap-2 text-center">
			<h1 class="text-xl font-semibold">Planer</h1>
			<p class="text-sm text-neutral-600">
				Zaloguj się kontem USOS, aby korzystać z aplikacji.
			</p>
		</div>

		{#if displayError}
			<p class="text-center text-sm text-red-600" role="alert">{displayError}</p>
		{/if}

		<form method="POST" use:enhance>
			<button
				type="submit"
				class="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
			>
				Zaloguj przez USOS
			</button>
		</form>
	</div>
</div>
