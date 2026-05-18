<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<main class="mx-auto max-w-lg p-6">
	<h1 class="text-xl font-semibold">Planer</h1>

	{#if data.user}
		<p class="mt-2 text-neutral-600">
			Zalogowano jako <strong>{data.user.displayName}</strong>
		</p>
		<form method="POST" action="/logout" class="mt-6">
			<button
				type="submit"
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
			>
				Wyloguj
			</button>
		</form>
	{/if}
</main>
