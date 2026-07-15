<script setup lang="ts">
import { formatearPrecio } from "~~/shared/transform/precio.ts";

const ui = useUiStore();
const cart = useCartStore();
const { checkout } = useWhatsAppCheckout();
</script>

<template>
  <div class="ov" :class="{ on: ui.cartOpen }" @click="ui.closeCart()" />
  <aside class="cd" :class="{ on: ui.cartOpen }" role="dialog" aria-modal="true" aria-label="Carrito">
    <div class="cdh">
      <h2 class="cdt">Tu Carrito</h2>
      <button class="cdc" aria-label="Cerrar" @click="ui.closeCart()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="cdb">
      <div v-if="!cart.items.length" class="cde">
        <div class="cdei">
          <IconCart :size="52" />
        </div>
        <div class="cdet">Tu carrito está vacío</div>
        <p class="cdep">Agregá tus fragancias favoritas.</p>
        <button class="btn btn-dk" style="margin-top:8px" @click="ui.closeCart()">Ver Catálogo</button>
      </div>

      <div v-else>
        <div v-for="i in cart.items" :key="i.id" class="cdi">
          <div class="cdi-ig">
            <img v-if="i.imagenUrl" :src="i.imagenUrl" referrerpolicy="no-referrer" alt="" loading="lazy">
          </div>
          <div class="cdi-inf">
            <div class="cdi-b">{{ i.marca }}</div>
            <div class="cdi-n">{{ i.nombre }}</div>
            <div class="cdi-s">
              {{ i.tamano }}
              <span v-if="i.agotado" style="color:var(--gr);font-weight:600"> · SIN STOCK</span>
            </div>
            <div class="cdi-r">
              <button class="qb" aria-label="Quitar uno" @click="cart.changeQty(i.id, -1)">−</button>
              <span class="qv">{{ i.qty }}</span>
              <button class="qb" aria-label="Agregar uno" @click="cart.changeQty(i.id, 1)">+</button>
            </div>
          </div>
          <div class="cdi-p">{{ formatearPrecio(i.precio * i.qty) }}</div>
        </div>
      </div>
    </div>

    <div v-if="cart.items.length" class="cdf">
      <div class="cdtl">
        <span class="cdtll">Total estimado</span>
        <span class="cdtlv">{{ formatearPrecio(cart.total) }}</span>
      </div>
      <button class="cdwa" @click="checkout(cart.items)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.524 5.836L0 24l6.344-1.483A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.851 0-3.584-.5-5.075-1.374l-.364-.215-3.767.881.897-3.668-.237-.378A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
        Pedir por WhatsApp
      </button>
    </div>
  </aside>
</template>
