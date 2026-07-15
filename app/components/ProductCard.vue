<script setup lang="ts">
import type { Product } from "~~/shared/types.ts";

const props = defineProps<{ product: Product }>();

const cart = useCartStore();
const wishlist = useWishlistStore();
const ui = useUiStore();
const notifications = useNotificationsStore();

const imgError = ref(false);
const wished = computed(() => wishlist.has(props.product.id));
const sinStock = computed(() => props.product.stock === "out");

const stockClass = computed(() =>
  props.product.stock === "ok" ? "s-ok" : props.product.stock === "low" ? "s-low" : "s-out");
const stockText = computed(() =>
  props.product.stock === "ok" ? "En stock" : props.product.stock === "low" ? "Últimas unidades" : "Sin stock");

function onAdd() {
  cart.add(props.product);
  notifications.notify(`${props.product.nombre} agregado al carrito`);
}
function onWish() {
  const added = wishlist.toggle(props.product.id);
  notifications.notify(added ? `${props.product.nombre} agregado a favoritos` : `${props.product.nombre} quitado de favoritos`);
}
</script>

<template>
  <article class="pc" style="cursor:pointer" @click="ui.openProduct(product.id)">
    <div class="pc-img">
      <img
        v-if="product.imagenUrl && !imgError"
        :src="product.imagenUrl"
        :alt="product.marca"
        referrerpolicy="no-referrer"
        loading="lazy"
        @error="imgError = true"
      >
      <BottlePlaceholder />
    </div>
    <div class="pc-bd">
      <div class="pc-br">{{ product.marca }}</div>
      <div class="pc-nm">{{ product.nombre }}</div>
      <div class="pc-badges">
        <span v-if="product.concentracion" class="type-badge">{{ product.concentracion }}</span>
        <span v-if="product.tamanoMl" class="size-badge">{{ product.tamanoMl }}ml</span>
      </div>

      <div v-if="product.notas.piramide" class="pc-nt note-box-sm">
        <div v-if="product.notas.piramide.salida" class="note-row-sm"><b>Salida:</b> {{ product.notas.piramide.salida }}</div>
        <div v-if="product.notas.piramide.corazon" class="note-row-sm"><b>Corazón:</b> {{ product.notas.piramide.corazon }}</div>
        <div v-if="product.notas.piramide.fondo" class="note-row-sm"><b>Fondo:</b> {{ product.notas.piramide.fondo }}</div>
      </div>
      <div v-else-if="product.notas.texto" class="pc-nt">{{ product.notas.texto }}</div>

      <div class="pc-stk">
        <span class="sdot" :class="stockClass" />
        <span class="stxt">{{ stockText }}</span>
      </div>

      <div class="pc-ft">
        <div>
          <span v-if="sinStock" class="pc-pr" style="font-size:13px;letter-spacing:.08em;color:var(--gr);font-weight:600">SIN STOCK</span>
          <span v-else class="pc-pr">{{ product.precioFmt }}</span>
        </div>
        <div class="pc-seg" role="group" aria-label="Acciones">
          <button
            class="pw pc-seg-i"
            :class="{ sel: wished }"
            :title="wished ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            :aria-pressed="wished"
            @click.stop="onWish"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" />
            </svg>
          </button>
          <button
            v-if="product.fichaSlug"
            class="pc-seg-i"
            title="Ficha técnica"
            @click.stop="ui.openFicha(product.fichaSlug)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="11" x2="12" y2="16" />
              <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button
            class="badd pc-seg-i"
            :disabled="sinStock"
            title="Agregar al carrito"
            @click.stop="onAdd"
          >
            <IconCart />
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
