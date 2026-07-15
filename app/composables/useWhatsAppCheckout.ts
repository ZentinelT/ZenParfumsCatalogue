import type { CartItem } from "~~/shared/types.ts";

const WA_NUMBER = "543515911990";

function fmt(n: number): string {
  return "$" + Math.trunc(n).toLocaleString("es-AR");
}

/** Arma el mensaje de pedido y abre wa.me (FR-012). Formato idéntico al legacy. */
export function useWhatsAppCheckout() {
  function checkout(items: CartItem[]) {
    if (!items.length) return;
    const lineas = items
      .map((i) => `- ${i.marca} ${i.nombre} (${i.tamano}) x${i.qty} = ${fmt(i.precio * i.qty)}`)
      .join("\n");
    const total = items.reduce((s, i) => s + i.precio * i.qty, 0);
    const msg =
      `Hola! Quisiera hacer el siguiente pedido:\n\n${lineas}\n\nTotal: ${fmt(total)}\n\n¿Cómo procedo con el pago?`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  return { checkout, WA_NUMBER };
}
