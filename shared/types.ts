// Modelo de datos publicado por el pipeline (data/catalog.json, data/fichas.json)
// y consumido por la app. Fuente única de verdad de tipos.

export type StockStatus = "ok" | "low" | "out";
export type Categoria = "arabes" | "internacional" | "accesorios";
export type Genero = "hombre" | "mujer" | "unisex";

/** Pirámide olfativa estructurada; cualquier nivel puede faltar. */
export interface Piramide {
  salida: string;
  corazon: string;
  fondo: string;
}

/** Notas de un producto: texto normalizado para búsqueda + pirámide si se detecta. */
export interface Notas {
  /** Texto normalizado (para búsqueda y fallback de display), o null si no hay. */
  texto: string | null;
  /** Pirámide salida/corazón/fondo si el texto era estructurable, si no null. */
  piramide: Piramide | null;
}

/** Producto ya transformado, listo para render. Ids estables de Supabase. */
export interface Product {
  id: number;
  slug: string;
  marca: string;
  /** Nombre limpio, sin prefijo de código ni sufijo `| ml`. */
  nombre: string;
  /** Nombre completo original (para búsqueda y matching de ficha). */
  nombreCompleto: string;
  concentracion: string | null;
  tamanoMl: number | null;
  precio: number;
  precioFmt: string;
  categoria: Categoria | string;
  genero: Genero;
  stock: StockStatus;
  imagenUrl: string;
  notas: Notas;
  /** Slug de la ficha técnica asociada, si existe. */
  fichaSlug?: string;
}

export interface Inspiracion {
  nombre?: string;
  texto?: string;
  imagen_url?: string;
}

/** Ficha técnica: los 25 campos actuales de Supabase, todos opcionales. */
export interface Ficha {
  slug: string;
  nombre_completo: string;
  marca?: string;
  anno?: string | number;
  concentracion?: string;
  genero?: string;
  familia_olfativa?: string;
  inspirado_en?: string;
  notas_salida?: string;
  notas_corazon?: string;
  notas_fondo?: string;
  descripcion?: string;
  momento_dia?: string;
  estacion?: string;
  ocasion?: string;
  clima?: string;
  proyeccion?: string;
  duracion?: string;
  estela?: string;
  color_liquido?: string;
  perfil_usuario?: string;
  rango_edad_min?: number;
  rango_edad_max?: number;
  estilo_descripcion?: string;
  inspirado_en_imagen_url?: string;
  inspirado_en_nombre?: string;
  inspiraciones?: Inspiracion[];
}

export interface CartItem {
  id: number;
  marca: string;
  nombre: string;
  nombreCompleto: string;
  tamano: string;
  precio: number;
  imagenUrl: string;
  qty: number;
}
