// @nuxt/eslint genera .nuxt/eslint.config.mjs tras `nuxi prepare`.
// Este flat config lo envuelve y agrega reglas propias.
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "vue/multi-word-component-names": "off",
  },
}).prepend({
  ignores: ["data/**", "index.html", "actualizar_catalogo.py", "tests/fixtures/**"],
});
