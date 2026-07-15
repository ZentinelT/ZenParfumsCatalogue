<script setup lang="ts">
const props = defineProps<{ current: number; pages: number }>();
const emit = defineEmits<{ change: [page: number] }>();

type Item = { type: "page"; n: number } | { type: "dots"; key: string };

const items = computed<Item[]>(() => {
  const out: Item[] = [];
  const shown = new Set<number>();
  for (let i = 1; i <= props.pages; i++) {
    if (i === 1 || i === props.pages || Math.abs(i - props.current) <= 1) {
      out.push({ type: "page", n: i });
      shown.add(i);
    } else if (Math.abs(i - props.current) === 2 && !shown.has(i)) {
      out.push({ type: "dots", key: `d${i}` });
      shown.add(i);
    }
  }
  return out;
});
</script>

<template>
  <div v-if="pages > 1" class="pag" role="navigation" aria-label="Paginación">
    <button v-if="current > 1" class="pag-btn" aria-label="Página anterior" @click="emit('change', current - 1)">‹</button>
    <template v-for="it in items" :key="it.type === 'page' ? it.n : it.key">
      <button
        v-if="it.type === 'page'"
        class="pag-btn"
        :class="{ cur: it.n === current }"
        :aria-current="it.n === current ? 'page' : undefined"
        @click="emit('change', it.n)"
      >
        {{ it.n }}
      </button>
      <span v-else class="pag-dots">…</span>
    </template>
    <button v-if="current < pages" class="pag-btn" aria-label="Página siguiente" @click="emit('change', current + 1)">›</button>
  </div>
</template>
