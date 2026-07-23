<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  src: string;
  alt: string;
  srcset?: string;
  sizes?: string;
}>();

const loaded = ref(false);
</script>

<template>
  <div class="blur-image" :class="{ loaded }">
    <img
      :src="src"
      :srcset="srcset"
      :sizes="sizes"
      :alt="alt"
      loading="lazy"
      decoding="async"
      @load="loaded = true"
    />
  </div>
</template>

<style scoped>
.blur-image {
  position: relative;
  overflow: hidden;
  background: var(--color-surface);
}

.blur-image img {
  display: block;
  width: 100%;
  height: auto;
  filter: blur(12px);
  opacity: 0;
  transition: opacity 0.5s ease, filter 0.5s ease, transform 0.3s ease;
}

.blur-image.loaded img {
  filter: blur(0);
  opacity: 1;
}
</style>
