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

const piramide = computed(() => props.product.notas.piramide);

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
  <div class="pm-img">
    <img
      v-if="product.imagenUrl && !imgError"
      :src="product.imagenUrl"
      :alt="product.marca"
      referrerpolicy="no-referrer"
      @error="imgError = true"
    >
    <BottlePlaceholder v-else />
    <button class="pw" :class="{ on: wished }" style="opacity:1" :aria-pressed="wished" title="Favoritos" @click="onWish">
      {{ wished ? "♥" : "♡" }}
    </button>
  </div>
  <div class="pm-bd">
    <div class="pm-br">{{ product.marca }}</div>
    <div class="pm-nm">{{ product.nombre }}</div>
    <div class="pm-badges">
      <span v-if="product.concentracion" class="type-badge">{{ product.concentracion }}</span>
      <span v-if="product.tamanoMl" class="size-badge">{{ product.tamanoMl }}ml</span>
    </div>
    <div class="pm-stk">
      <span class="sdot" :class="stockClass" />
      <span class="stxt">{{ stockText }}</span>
    </div>

    <template v-if="piramide">
      <div class="pm-nt-t">Pirámide olfativa</div>
      <div class="pm-nt note-box">
        <div v-if="piramide.salida" class="note-row"><span class="note-lbl">Notas de salida:</span> <span class="note-txt">{{ piramide.salida }}</span></div>
        <div v-if="piramide.corazon" class="note-row"><span class="note-lbl">Notas de corazón:</span> <span class="note-txt">{{ piramide.corazon }}</span></div>
        <div v-if="piramide.fondo" class="note-row"><span class="note-lbl">Notas de fondo:</span> <span class="note-txt">{{ piramide.fondo }}</span></div>
      </div>
    </template>
    <template v-else-if="product.notas.texto">
      <div class="pm-nt-t">Pirámide olfativa</div>
      <div class="pm-nt">{{ product.notas.texto }}</div>
    </template>

    <button v-if="product.fichaSlug" class="pm-ficha" @click="ui.openFicha(product.fichaSlug)">
      Ver ficha técnica completa
    </button>

    <div class="pm-ft">
      <span v-if="sinStock" class="pm-pr" style="font-size:15px;letter-spacing:.06em;color:var(--gr)">SIN STOCK</span>
      <span v-else class="pm-pr">{{ product.precioFmt }}</span>
      <button class="pm-add" :disabled="sinStock" @click="onAdd">
        <IconCart :size="16" />Agregar
      </button>
    </div>
  </div>
</template>
