<script setup lang="ts">
const cart = useCartStore();
const wishlist = useWishlistStore();
const ui = useUiStore();

const scrolled = ref(false);
function onScroll() { scrolled.value = window.scrollY > 10; }
onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));

const heartPath = "M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z";
</script>

<template>
  <div class="ann">
    <strong>✓ Perfumes 100% Originales</strong>
    <span class="ann-sep">|</span>
    <strong>✓ Garantía de Autenticidad</strong>
  </div>

  <header class="hdr" :class="{ sc: scrolled }">
    <div class="hdr-in">
      <nav class="hnav hnav-l" aria-label="Navegación principal izquierda">
        <a href="#catalogo">Catálogo</a>
        <a href="#catalogo">Categorías</a>
      </nav>

      <div class="hmob-l">
        <button class="hbur" aria-label="Menú" :aria-expanded="ui.mobOpen" @click="ui.openMob()">
          <span /><span /><span />
        </button>
        <button class="hib" aria-label="Favoritos" @click="ui.openWish()">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path :d="heartPath" /></svg>
          <span v-show="wishlist.count > 0" class="cbadge">{{ wishlist.count }}</span>
        </button>
        <button class="hib hib-mob-cart" aria-label="Carrito" @click="ui.openCart()">
          <IconCart :size="19" />
          <span v-show="cart.count > 0" class="cbadge">{{ cart.count }}</span>
        </button>
      </div>

      <NuxtLink class="logo" to="/">
        <span class="logo-n">ZEN PARFUMS</span>
        <span class="logo-s">Online Fragrance Boutique</span>
      </NuxtLink>

      <div class="hmeta">
        <nav class="hnav hnav-r" aria-label="Navegación principal derecha">
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div class="hact">
          <ThemeToggle />
          <button class="hib" aria-label="Favoritos" @click="ui.openWish()">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path :d="heartPath" /></svg>
            <span v-show="wishlist.count > 0" class="cbadge">{{ wishlist.count }}</span>
          </button>
          <button class="hib" aria-label="Carrito" @click="ui.openCart()">
            <IconCart :size="19" />
            <span v-show="cart.count > 0" class="cbadge">{{ cart.count }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
