import { browser } from "$app/environment";

const STORAGE_KEY = "planer-card-colors";

export const cardColors = $state({
	enabled: false,
});

export function initCardColors() {
	if (!browser) return;
	cardColors.enabled = localStorage.getItem(STORAGE_KEY) === "true";
}

export function toggleCardColors() {
	cardColors.enabled = !cardColors.enabled;
	if (browser) {
		localStorage.setItem(STORAGE_KEY, cardColors.enabled ? "true" : "false");
	}
}
