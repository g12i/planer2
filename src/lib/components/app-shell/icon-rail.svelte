<script lang="ts">
	import BookIcon from 'phosphor-svelte/lib/BookIcon';
	import BuildingsIcon from 'phosphor-svelte/lib/BuildingsIcon';
	import CalendarIcon from 'phosphor-svelte/lib/CalendarIcon';
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import UserCircleIcon from 'phosphor-svelte/lib/UserCircleIcon';
	import UserIcon from 'phosphor-svelte/lib/UserIcon';

	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import TooltipProvider from '$lib/components/ui/tooltip-provider.svelte';
	import { theme, toggleTheme } from '$lib/theme.svelte';

	const ICON_RAIL_LINKS = [
		{ icon: SquaresFourIcon, label: 'Plany' },
		{ icon: CalendarIcon, label: 'Kalendarz' },
		{ icon: BookIcon, label: 'Przedmioty' },
		{ icon: UserCircleIcon, label: 'Profil' },
		{ icon: BuildingsIcon, label: 'Uczelnia' },
	] as const;

	type Props = {
		user: { displayName: string };
		onLogout: () => void;
	};

	let { user, onLogout }: Props = $props();
</script>

<TooltipProvider>
	<nav
		class="flex h-full min-h-0 w-14 shrink-0 flex-col items-center gap-1 border-border-card bg-background py-3"
		aria-label="Nawigacja główna"
	>
		{#each ICON_RAIL_LINKS as link, index (link.label)}
			<Tooltip label={link.label} active={index === 0}>
				{#snippet trigger()}
					<link.icon class="size-5" weight="regular" />
				{/snippet}
			</Tooltip>
		{/each}

		<div class="mt-auto">
			<DropdownMenu
				triggerAriaLabel={`Konto użytkownika: ${user.displayName}`}
				contentProps={{ side: 'right', align: 'end', sideOffset: 8 }}
			>
				{#snippet trigger()}
					<UserIcon class="size-5" weight="regular" />
				{/snippet}
				{#snippet header()}
					<span class="block max-w-40 truncate">
						{user.displayName}
					</span>
				{/snippet}
				{#snippet content()}
					<DropdownMenuItem onSelect={toggleTheme}>
						{#snippet icon()}
							{#if theme.dark}
								<SunIcon weight="regular" />
							{:else}
								<MoonIcon weight="regular" />
							{/if}
						{/snippet}
						{#if theme.dark}
							Jasny motyw
						{:else}
							Ciemny motyw
						{/if}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={onLogout}>
						{#snippet icon()}
							<SignOutIcon weight="regular" />
						{/snippet}
						Wyloguj
					</DropdownMenuItem>
				{/snippet}
			</DropdownMenu>
		</div>
	</nav>
</TooltipProvider>
