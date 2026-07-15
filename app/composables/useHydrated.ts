/**
 * `false` durante SSR y en el primer render del cliente; `true` tras montar.
 *
 * Sirve para todo lo que dependa de estado que solo existe en el navegador
 * (localStorage: favoritos, carrito, tema). Si se lee directo en el render, el
 * HTML del build y el primer render del cliente difieren y Vue reporta un
 * hydration mismatch. Con este gate ambos coinciden y el valor real se aplica
 * justo después de montar.
 */
export function useHydrated() {
  const hydrated = ref(false);
  onMounted(() => { hydrated.value = true; });
  return hydrated;
}
