// https://nuxt.com/docs/api/configuration/nuxt-config
// SSG estricto: GitHub Pages no soporta SSR. Todo dinámico post-build ocurre
// en el navegador (revalidación de stock/precio).

// baseURL: '/' con dominio custom; '/ZenParfumsCatalogue/' para project page.
// Definir según T002 (config de GitHub Pages). Overridable por env en CI.
const baseURL = process.env.NUXT_APP_BASE_URL || "/";

const SUPABASE_ORIGIN = "https://syylbuvjuekkanxynpps.supabase.co";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-01",
  ssr: true,

  modules: [
    "@nuxt/eslint",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/sitemap",
  ],

  css: ["~/assets/css/tokens.css"],

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: "es" },
      meta: [
        { charset: "UTF-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { name: "referrer", content: "no-referrer" },
        // CSP por meta (plan.md §Seguridad). connect-src incluye Supabase (revalidación).
        {
          "http-equiv": "Content-Security-Policy",
          content: [
            "default-src 'self'",
            "img-src 'self' https: data:",
            `connect-src 'self' ${SUPABASE_ORIGIN}`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com",
            "script-src 'self'",
          ].join("; "),
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
      ],
    },
  },

  colorMode: {
    preference: "system",
    fallback: "light",
    dataValue: "theme", // => <html data-theme="dark">
    storageKey: "zp-theme",
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ["/", "/sitemap.xml"],
    },
  },

  site: {
    // Ajustar al dominio real de producción para sitemap/canonical (HU-3).
    url: process.env.NUXT_SITE_URL || "https://example.com",
  },

  typescript: {
    strict: true,
    typeCheck: false, // se corre aparte con `nuxi typecheck` en CI
  },
});
