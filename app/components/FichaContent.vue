<script setup lang="ts">
import type { Ficha, Inspiracion } from "~~/shared/types.ts";

const props = defineProps<{ ficha: Ficha; nombre: string; marcaFallback?: string }>();

interface InspView { nombre: string; texto?: string; imagen?: string }

const inspiraciones = computed<InspView[]>(() => {
  const f = props.ficha;
  if (f.inspiraciones?.length) {
    return f.inspiraciones.map((i: Inspiracion) => ({ nombre: i.nombre ?? "", texto: i.texto, imagen: i.imagen_url }));
  }
  if (f.inspirado_en_nombre) {
    return [{ nombre: f.inspirado_en_nombre, texto: f.inspirado_en, imagen: f.inspirado_en_imagen_url }];
  }
  return [];
});

const tieneNotas = computed(() => props.ficha.notas_salida || props.ficha.notas_corazon || props.ficha.notas_fondo);

const rango = computed(() => {
  const f = props.ficha;
  return f.rango_edad_min && f.rango_edad_max ? `${f.rango_edad_min}–${f.rango_edad_max} años` : "";
});

const datos = computed(() => {
  const f = props.ficha;
  return [
    ["Familia olfativa", f.familia_olfativa],
    ["Momento del día", f.momento_dia],
    ["Estación", f.estacion],
    ["Ocasión", f.ocasion],
    ["Clima", f.clima],
    ["Proyección", f.proyeccion],
    ["Duración", f.duracion],
    ["Estela", f.estela],
    ["Color del líquido", f.color_liquido],
    ["Rango de edad sugerido", rango.value],
  ].filter(([, v]) => Boolean(v)) as [string, string][];
});
</script>

<template>
  <div class="fc-bd">
    <div class="pm-br">{{ ficha.marca || marcaFallback }}</div>
    <div class="pm-nm">{{ nombre }}</div>
    <div class="pm-badges">
      <span v-if="ficha.genero" class="type-badge">{{ ficha.genero }}</span>
      <span v-if="ficha.concentracion" class="size-badge">{{ ficha.concentracion }}</span>
    </div>

    <div v-for="(insp, idx) in inspiraciones" :key="idx" class="fc-insp">
      <img v-if="insp.imagen" :src="insp.imagen" referrerpolicy="no-referrer" alt="">
      <div>
        <div class="fc-insp-nm">{{ insp.nombre }}</div>
        <div v-if="insp.texto" class="fc-insp-tx">{{ insp.texto }}</div>
      </div>
    </div>

    <template v-if="ficha.descripcion">
      <div class="fc-nt-t">Descripción</div>
      <div class="fc-desc">{{ ficha.descripcion }}</div>
    </template>

    <template v-if="tieneNotas">
      <div class="fc-nt-t">Pirámide olfativa</div>
      <div class="fc-notes note-box">
        <div v-if="ficha.notas_salida" class="note-row"><span class="note-lbl">Notas de salida:</span> <span class="note-txt">{{ ficha.notas_salida }}</span></div>
        <div v-if="ficha.notas_corazon" class="note-row"><span class="note-lbl">Notas de corazón:</span> <span class="note-txt">{{ ficha.notas_corazon }}</span></div>
        <div v-if="ficha.notas_fondo" class="note-row"><span class="note-lbl">Notas de fondo:</span> <span class="note-txt">{{ ficha.notas_fondo }}</span></div>
      </div>
    </template>

    <template v-if="ficha.estilo_descripcion">
      <div class="fc-nt-t">Perfil / estilo</div>
      <div class="fc-desc">{{ ficha.estilo_descripcion }}</div>
    </template>

    <div class="fc-nt-t">Datos técnicos</div>
    <div class="fc-grid">
      <div v-for="([lb, vl]) in datos" :key="lb" class="fc-row">
        <div class="fc-lb">{{ lb }}</div>
        <div class="fc-vl">{{ vl }}</div>
      </div>
    </div>
  </div>
</template>
