// https://nuxt.com/docs/api/configuration/nuxt-config
// SSG estricto: GitHub Pages no soporta SSR. Todo dinámico post-build ocurre
// en el navegador (revalidación de stock/precio).
import { existsSync, readFileSync } from "node:fs";

// Rutas /perfume/<slug> de todos los productos activos, para prerender + sitemap.
// data/catalog.json lo genera fetch-catalog antes del build (generate:fixture).
function productRoutes(): string[] {
  try {
    if (!existsSync("data/catalog.json")) return [];
    const items = JSON.parse(readFileSync("data/catalog.json", "utf8")) as {
      slug: string; categoria: string;
    }[];
    return items
      .filter((p) => p.categoria !== "accesorios" && p.slug)
      .map((p) => `/perfume/${p.slug}`);
  } catch {
    return [];
  }
}

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

  css: ["~/assets/css/tokens.css", "~/assets/css/components.css"],

  runtimeConfig: {
    public: {
      // Revalidación de stock/precio en runtime (FR-016).
      // La anon key solo puede leer la vista pública `catalogo_publico` (RLS, T003).
      // Si falta, la revalidación se desactiva y quedan los datos del build.
      supabaseUrl: SUPABASE_ORIGIN,
      supabaseAnonKey: "",
      catalogoPublicoTable: "catalogo_publico",
      margenNormal: 15000,
      margenTubbees: 10000,
    },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: "es" },
      meta: [
        { charset: "UTF-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { name: "referrer", content: "no-referrer" },
        // CSP por meta (plan.md §Seguridad). connect-src incluye Supabase (revalidación).
        //
        // script-src necesita 'unsafe-inline': Nuxt emite scripts inline para
        // hidratación, payload y el tema sin flash, y una CSP por <meta> no
        // admite nonces (requeriría cabeceras HTTP, que GitHub Pages no permite).
        // La inyección de HTML crudo que motivaba esta regla ya no existe: Vue
        // escapa todo por templating (NFR-005).
        {
          "http-equiv": "Content-Security-Policy",
          content: [
            "default-src 'self'",
            "img-src 'self' https: data:",
            `connect-src 'self' ${SUPABASE_ORIGIN}`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com",
            "script-src 'self' 'unsafe-inline'",
            "base-uri 'none'",
            "object-src 'none'",
            // frame-ancestors se ignora vía <meta>; requiere cabecera HTTP.
          ].join("; "),
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap",
        },
      ],
    },
  },

  // El módulo de persistedstate usa COOKIES por defecto. El sitio legacy guarda
  // carrito y favoritos en localStorage (`zp2`, `zp-wish`) y la migración sin
  // pérdida es requisito (HU-4.2, NFR-006). Además las cookies viajan en cada
  // request y topan en ~4 KB, lo que rompería un carrito grande.
  piniaPluginPersistedstate: {
    storage: "localStorage",
  },

  colorMode: {
    preference: "system",
    fallback: "light",
    dataValue: "theme", // => <html data-theme="dark">
    storageKey: "zp-theme",
  },

  nitro: {
    prerender: {
      // Sin crawler: las rutas se enumeran completas más abajo. Con baseURL de
      // project page el crawler seguía el href del logo (`/ZenParfumsCatalogue/`)
      // y lo registraba como una ruta extra, metiendo un <loc> duplicado
      // (…/ZenParfumsCatalogue/ZenParfumsCatalogue) en el sitemap.
      crawlLinks: false,
      routes: ["/", "/sitemap.xml", ...productRoutes()],
    },
  },

  site: {
    // Solo el ORIGEN (sin path): sitemap y canonical le suman app.baseURL.
    url: process.env.NUXT_SITE_URL || "https://example.com",
  },


  typescript: {
    strict: true,
    typeCheck: false, // se corre aparte con `nuxi typecheck` en CI
  },
});
