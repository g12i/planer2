<script lang="ts">
	import BookIcon from 'phosphor-svelte/lib/BookIcon';
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import UserSwitchIcon from 'phosphor-svelte/lib/UserSwitchIcon';
	import UserIcon from 'phosphor-svelte/lib/UserIcon';

	import { page } from '$app/state';
	import Button from '$lib/components/ui/button.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/ui/dropdown-menu-item.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { theme, toggleTheme } from '$lib/theme.svelte';

	const ICON_RAIL_LINKS = [
		{ icon: SquaresFourIcon, label: 'Plany', href: '/', match: '/' },
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
				<Button
					{...props}
					variant={active ? 'primary' : 'ghost'}
					size="icon"
					href={'href' in link ? link.href : undefined}
					aria-label={link.label}
					aria-current={active ? 'page' : undefined}
				>
					<link.icon class="size-5" weight="regular" />
				</Button>
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
