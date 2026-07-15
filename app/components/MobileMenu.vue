<script setup lang="ts">
const ui = useUiStore();
</script>

<template>
  <div class="ov" :class="{ on: ui.mobOpen }" @click="ui.closeMob()" />
  <nav class="mob" :class="{ on: ui.mobOpen }" aria-label="Menú móvil">
    <button class="mob-cl" aria-label="Cerrar menú" @click="ui.closeMob()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
    </button>
    <div class="mob-li">
      <a href="#catalogo" @click="ui.closeMob()">Catálogo</a>
      <a href="#catalogo" @click="ui.closeMob()">Categorías</a>
      <a href="#nosotros" @click="ui.closeMob()">Nosotros</a>
      <a href="#contacto" @click="ui.closeMob()">Contacto</a>
      <ThemeToggle variant="menu" />
    </div>
  </nav>
</template>
