<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import IconRail from '$lib/components/app-shell/icon-rail.svelte';
	import MainColumn from '$lib/components/app-shell/main-column.svelte';
	import SidebarPanel from '$lib/components/app-shell/sidebar-panel.svelte';
	import Separator from '$lib/components/ui/separator.svelte';

	type Props = {
		user: { displayName: string };
		children: Snippet;
		sidebar: Snippet;
		title: string;
	};

	let { user, children, sidebar, title }: Props = $props();

	let sidebarOpen = $state(true);
	let logoutForm = $state<HTMLFormElement | null>(null);

	function logout() {
		logoutForm?.requestSubmit();
	}
</script>

<div class="flex h-screen min-h-0 flex-col bg-background">
	<Collapsible.Root bind:open={sidebarOpen} class="flex min-h-0 flex-1">
		<div class="flex h-full min-h-0 min-w-0 flex-1">
			<IconRail {user} onLogout={logout} />

			<form
				bind:this={logoutForm}
				method="POST"
				action="/logout"
				class="hidden"
				aria-hidden="true"
			>
				<button type="submit" tabindex="-1">Wyloguj</button>
			</form>

			<Separator orientation="vertical" decorative />

			<SidebarPanel {sidebar} />

			<Separator orientation="vertical" decorative />

			<MainColumn {sidebarOpen} {title}>
				{@render children()}
			</MainColumn>
		</div>
	</Collapsible.Root>
</div>
