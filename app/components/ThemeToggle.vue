<script setup lang="ts">
defineProps<{ variant?: "icon" | "menu" }>();

const colorMode = useColorMode();
// El tema sale de localStorage/prefers-color-scheme: gate hasta montar (ver useHydrated).
const hydrated = useHydrated();

const isDark = computed(() => hydrated.value && colorMode.value === "dark");
const label = computed(() => (isDark.value ? "Activar modo claro" : "Activar modo oscuro"));

function toggle() {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <button
    v-if="variant === 'menu'"
    class="mob-theme"
    type="button"
    :aria-label="label"
    @click="toggle"
  >
    <ThemeIcon :dark="isDark" />
    <span>{{ isDark ? "Modo claro" : "Modo oscuro" }}</span>
  </button>
  <button
    v-else
    class="hib theme-toggle"
    type="button"
    :aria-label="label"
    :title="label"
    @click="toggle"
  >
    <ThemeIcon :dark="isDark" />
  </button>
</template>
