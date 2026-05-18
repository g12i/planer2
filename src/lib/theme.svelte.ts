import { browser } from "$app/environment";

const STORAGE_KEY = "planer-theme";

function applyDark(dark: boolean) {
  if (!browser) return;
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
}

export const theme = $state({
  dark: false,
});

export function initTheme() {
  if (!browser) return;
  theme.dark = document.documentElement.classList.contains("dark");
}

export function toggleTheme() {
  theme.dark = !theme.dark;
  applyDark(theme.dark);
}
