<script lang="ts">
	import BookIcon from 'phosphor-svelte/lib/BookIcon';
	import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
	import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import UserIcon from 'phosphor-svelte/lib/UserIcon';
	import UserSwitchIcon from 'phosphor-svelte/lib/UserSwitchIcon';

	import { page } from '$app/state';
	import { cardColors, toggleCardColors } from '$lib/card-colors.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { theme, toggleTheme } from '$lib/theme.svelte';
	import MenuItem from '../ui/menu-item.svelte';

	const ICON_RAIL_LINKS = [
		{ icon: SquaresFourIcon, label: 'Plany', href: '/', match: '/plany' },
		{ icon: BookIcon, label: 'Katalog', href: '/katalog', match: '/katalog' },
		{
			icon: UserSwitchIcon,
			label: 'Dostępność prowadzących',
			href: '/dostepnosc-prowadzacych',
			match: '/dostepnosc-prowadzacych',
		},
	] as const;

	type Props = {
		user: { displayName: string };
		onLogout: () => void;
	};

	let { user, onLogout }: Props = $props();

	function isActive(link: (typeof ICON_RAIL_LINKS)[number]): boolean {
		if (!('match' in link)) return false;
		const path = page.url.pathname;
		if (link.match === '/') return path === '/';
		return path === link.match || path.startsWith(`${link.match}/`);
	}
</script>

<nav
	class="flex h-full min-h-0 w-14 shrink-0 flex-col items-center gap-1 border-border-card bg-background py-3"
	aria-label="Nawigacja główna"
>
	{#each ICON_RAIL_LINKS as link (link.label)}
		{@const active = isActive(link)}
		<Tooltip label={link.label}>
			{#snippet trigger(props)}
				<MenuItem
					active={active}
					size="icon"
					href={'href' in link ? link.href : undefined}
					aria-label={link.label}
					aria-current={active ? 'page' : undefined}
				>
					<link.icon class="size-5" weight="regular" />
				</MenuItem>
			{/snippet}
		</Tooltip>
	{/each}

	<div class="mt-auto">
		<DropdownMenu
			triggerAriaLabel={`Konto użytkownika: ${user.displayName}`}
			contentProps={{ side: 'right', align: 'end', sideOffset: 8 }}
		>
			{#snippet trigger()}
				<UserIcon />
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
						<SunIcon />
					{:else}
						<MoonIcon />
					{/if}
				{/snippet}
				{#if theme.dark}
					Jasny motyw
				{:else}
					Ciemny motyw
				{/if}
			</DropdownMenuItem>
			<DropdownMenuItem onSelect={toggleCardColors}>
				{#snippet icon()}
					{#if cardColors.enabled}
						<PaletteIcon />
					{:else}
						<PaletteIcon />
					{/if}
				{/snippet}
				{cardColors.enabled ? 'Wyłącz kolory' : 'Koloruj karty'}
			</DropdownMenuItem>
			<DropdownMenuItem onSelect={onLogout}>
					{#snippet icon()}
						<SignOutIcon />
					{/snippet}
					Wyloguj
				</DropdownMenuItem>
			{/snippet}
		</DropdownMenu>
	</div>
</nav>
