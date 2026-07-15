<script setup lang="ts">
import type { Product } from "~~/shared/types.ts";

const ui = useUiStore();
const wishlist = useWishlistStore();
const cart = useCartStore();
const notifications = useNotificationsStore();
const { productos } = useCatalogData();

const items = computed(() => wishlist.products(productos));

function quitar(p: Product) {
  wishlist.toggle(p.id);
  notifications.notify(`${p.nombre} quitado de favoritos`);
}
function agregar(p: Product) {
  if (p.stock === "out") return;
  cart.add(p);
  notifications.notify(`${p.nombre} agregado al carrito`);
}
</script>

<template>
  <div class="ov" :class="{ on: ui.wishOpen }" @click="ui.closeWish()" />
  <aside class="cd" :class="{ on: ui.wishOpen }" role="dialog" aria-modal="true" aria-label="Favoritos">
    <div class="cdh">
      <h2 class="cdt">Favoritos</h2>
      <button class="cdc" aria-label="Cerrar" @click="ui.closeWish()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="cdb">
      <div v-if="!items.length" class="cde">
        <div class="cdei">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" /></svg>
        </div>
        <div class="cdet">No tenés favoritos</div>
        <p class="cdep">Tocá el corazón en cualquier perfume para guardarlo acá.</p>
        <button class="btn btn-dk" style="margin-top:8px" @click="ui.closeWish()">Ver Catálogo</button>
      </div>

      <div v-else>
        <div v-for="p in items" :key="p.id" class="cdi">
          <div class="cdi-ig">
            <img v-if="p.imagenUrl" :src="p.imagenUrl" referrerpolicy="no-referrer" alt="" loading="lazy">
          </div>
          <div class="cdi-inf">
            <div class="cdi-b">{{ p.marca }}</div>
            <div class="cdi-n">{{ p.nombre }}</div>
            <div class="cdi-s">{{ p.tamanoMl ? `${p.tamanoMl}ml` : "" }}</div>
            <div class="cdi-r">
              <button class="qb" title="Quitar de favoritos" @click="quitar(p)">✕</button>
              <button class="qb" title="Agregar al carrito" :disabled="p.stock === 'out'" @click="agregar(p)">
                <IconCart :size="12" />
              </button>
            </div>
          </div>
          <div class="cdi-p">{{ p.stock === "out" ? "Sin stock" : p.precioFmt }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>
