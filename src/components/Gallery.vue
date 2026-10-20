<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import BlurImage from './BlurImage.vue';
import { GENRES, genreOf, type CategorySlug, type GenreSlug } from '../lib/categories';
import { getDisplaySrcSet, getThumbnailSrcSet } from '../lib/srcset';

interface Photo {
  id: string;
  title: string;
  category: CategorySlug;
  description: string | null;
  shootDate: string | null;
  featured: boolean;
  thumbnailUrl: string;
  displayUrl: string;
  camera: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  exposureTime: number | null;
  iso: number | null;
}

type Filter = 'all' | CategorySlug;

const props = defineProps<{
  genre?: GenreSlug;
  highlights?: boolean;
}>();

const photos = ref<Photo[]>([]);
const loading = ref(true);
const activeFilter = ref<Filter>('all');
const openIndex = ref<number | null>(null);

const scopedCategories = computed(() => (props.genre ? GENRES[props.genre].categories : {}));

const filters = computed<{ value: Filter; label: string }[]>(() => [
  { value: 'all', label: 'All' },
  ...(Object.entries(scopedCategories.value) as [CategorySlug, string][]).map(([value, label]) => ({
    value,
    label,
  })),
]);

const genreScopedPhotos = computed(() =>
  props.genre ? photos.value.filter((photo) => genreOf(photo.category) === props.genre) : photos.value
);

const highlightPhotos = computed(() => {
  const featured = photos.value.filter((photo) => photo.featured);
  return (Object.keys(GENRES) as GenreSlug[]).flatMap((genre) =>
    featured.filter((photo) => genreOf(photo.category) === genre)
  );
});

const filteredPhotos = computed(() => {
  if (props.highlights) return highlightPhotos.value;
  return activeFilter.value === 'all'
    ? genreScopedPhotos.value
    : genreScopedPhotos.value.filter((photo) => photo.category === activeFilter.value);
});

function genreLabel(photo: Photo) {
  return GENRES[genreOf(photo.category)].label;
}

const openPhoto = computed(() =>
  openIndex.value !== null ? filteredPhotos.value[openIndex.value] : null
);

function formatShutter(seconds: number) {
  return seconds < 1 ? `1/${Math.round(1 / seconds)}s` : `${Number(seconds.toFixed(1))}s`;
}

// e.g. "Sony ILCE-7M3 · FE 24-70mm F2.8 GM · 35mm · f/2.8 · 1/250s · ISO 400"
const cameraSettings = computed(() => {
  const photo = openPhoto.value;
  if (!photo) return '';
  return [
    photo.camera,
    photo.lens,
    photo.focalLength && `${Math.round(photo.focalLength)}mm`,
    photo.aperture && `f/${Number(photo.aperture.toFixed(1))}`,
    photo.exposureTime && formatShutter(photo.exposureTime),
    photo.iso && `ISO ${photo.iso}`,
  ]
    .filter(Boolean)
    .join(' · ');
});

function selectFilter(filter: Filter) {
  activeFilter.value = filter;
  openIndex.value = null;
}

function openLightbox(index: number) {
  openIndex.value = index;
}

function closeLightbox() {
  openIndex.value = null;
}

function showNext() {
  if (openIndex.value === null) return;
  openIndex.value = (openIndex.value + 1) % filteredPhotos.value.length;
}

function showPrev() {
  if (openIndex.value === null) return;
  openIndex.value = (openIndex.value - 1 + filteredPhotos.value.length) % filteredPhotos.value.length;
}

function onKeydown(event: KeyboardEvent) {
  if (openIndex.value === null) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowRight') showNext();
  if (event.key === 'ArrowLeft') showPrev();
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  try {
    const res = await fetch('/api/photos.json');
    photos.value = await res.json();
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="gallery">
    <nav v-if="!highlights" class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="filter-button"
        :class="{ active: activeFilter === filter.value }"
        @click="selectFilter(filter.value)"
      >
        {{ filter.label }}
      </button>
    </nav>

    <p v-if="loading" class="status">Loading…</p>
    <p v-else-if="filteredPhotos.length === 0" class="status">
      {{ genre ? 'No photos in this genre yet.' : 'No photos yet.' }}
    </p>

    <div v-else class="masonry">
      <figure
        v-for="(photo, index) in filteredPhotos"
        :key="photo.id"
        class="masonry-item"
        @click="openLightbox(index)"
      >
        <BlurImage
          :src="photo.thumbnailUrl"
          :srcset="getThumbnailSrcSet(photo.thumbnailUrl)"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          :alt="photo.title"
        />
        <figcaption>
          {{ photo.title }}
          <span v-if="highlights" class="genre-tag">{{ genreLabel(photo) }}</span>
        </figcaption>
      </figure>
    </div>

    <div v-if="openPhoto" class="lightbox" @click.self="closeLightbox">
      <button type="button" class="lightbox-close" aria-label="Close" @click="closeLightbox">✕</button>
      <button type="button" class="lightbox-prev" aria-label="Previous photo" @click="showPrev">‹</button>
      <button type="button" class="lightbox-next" aria-label="Next photo" @click="showNext">›</button>

      <figure class="lightbox-content">
        <BlurImage
          :src="openPhoto.displayUrl"
          :srcset="getDisplaySrcSet(openPhoto.displayUrl)"
          sizes="90vw"
          :alt="openPhoto.title"
        />
        <figcaption>
          <h2>{{ openPhoto.title }}</h2>
          <p v-if="openPhoto.description">{{ openPhoto.description }}</p>
          <p v-if="openPhoto.shootDate" class="meta">{{ openPhoto.shootDate }}</p>
          <p v-if="cameraSettings" class="meta camera-settings">{{ cameraSettings }}</p>
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.gallery {
  padding: 2rem 1.5rem;
}

.filter-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.filter-button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.filter-button:hover {
  color: var(--color-text);
  border-color: var(--color-accent-dim);
}

.filter-button.active {
  color: var(--color-bg);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.status {
  text-align: center;
  color: var(--color-muted);
}

.masonry {
  column-count: 1;
  column-gap: 1rem;
}

@media (min-width: 640px) {
  .masonry {
    column-count: 2;
  }
}

@media (min-width: 1024px) {
  .masonry {
    column-count: 3;
  }
}

.masonry-item {
  margin: 0 0 1rem;
  break-inside: avoid;
  cursor: pointer;
}

.masonry-item figcaption {
  padding: 0.5rem 0.25rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.genre-tag {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.05rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.7rem;
  color: var(--color-accent);
}

.masonry-item:hover :deep(img) {
  transform: scale(1.05);
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.lightbox-content {
  max-width: min(90vw, 1200px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-content :deep(img) {
  max-height: 75vh;
  width: auto;
  max-width: 100%;
}

.lightbox-content figcaption {
  color: var(--color-text);
  text-align: center;
  margin-top: 1rem;
}

.lightbox-content .meta {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.lightbox-content .camera-settings {
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  margin-top: 0.25rem;
}

.lightbox-close,
.lightbox-prev,
.lightbox-next {
  position: absolute;
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.lightbox-close {
  top: 1.5rem;
  right: 1.5rem;
}

.lightbox-prev {
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-next {
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
}
</style>
