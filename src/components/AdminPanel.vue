<script setup lang="ts">
import { ref } from 'vue';
import { actions } from 'astro:actions';
import { CATEGORIES, type CategorySlug } from '../lib/categories';

interface Photo {
  id: string;
  title: string;
  category: CategorySlug;
  description: string | null;
  shootDate: string | null;
  visible: boolean;
  order: number;
  thumbnailUrl: string;
  displayUrl: string;
  createdAt: string;
}

const props = defineProps<{
  initialPhotos: Photo[];
}>();

const photos = ref<Photo[]>(props.initialPhotos);

const fileInput = ref<HTMLInputElement | null>(null);
const uploadForm = ref({
  title: '',
  category: 'landscape-nature' as CategorySlug,
  description: '',
  shootDate: '',
});
const uploading = ref(false);
const uploadError = ref<string | null>(null);

const editingId = ref<string | null>(null);
const editForm = ref({
  title: '',
  category: 'landscape-nature' as CategorySlug,
  description: '',
  shootDate: '',
  visible: true,
});
const editError = ref<string | null>(null);

async function logout() {
  await actions.logout();
  window.location.href = '/admin/login';
}

async function submitUpload() {
  const file = fileInput.value?.files?.[0];
  if (!file) {
    uploadError.value = 'Choose a file first.';
    return;
  }

  uploading.value = true;
  uploadError.value = null;

  const formData = new FormData();
  formData.set('file', file);
  formData.set('title', uploadForm.value.title);
  formData.set('category', uploadForm.value.category);
  formData.set('description', uploadForm.value.description);
  formData.set('shootDate', uploadForm.value.shootDate);

  const { error } = await actions.uploadPhoto(formData);
  uploading.value = false;

  if (error) {
    uploadError.value = error.message;
    return;
  }

  window.location.reload();
}

function startEdit(photo: Photo) {
  editingId.value = photo.id;
  editForm.value = {
    title: photo.title,
    category: photo.category,
    description: photo.description ?? '',
    shootDate: photo.shootDate ?? '',
    visible: photo.visible,
  };
  editError.value = null;
}

function cancelEdit() {
  editingId.value = null;
  editError.value = null;
}

async function saveEdit(id: string) {
  const { error } = await actions.updatePhoto({ id, ...editForm.value });
  if (error) {
    editError.value = error.message;
    return;
  }
  window.location.reload();
}

async function remove(id: string, title: string) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  const { error } = await actions.deletePhoto({ id });
  if (error) {
    alert(error.message);
    return;
  }
  window.location.reload();
}

async function move(index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= photos.value.length) return;

  const reordered = [...photos.value];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

  const { error } = await actions.reorderPhotos({ orderedIds: reordered.map((p) => p.id) });
  if (error) {
    alert(error.message);
    return;
  }
  window.location.reload();
}
</script>

<template>
  <div class="admin">
    <header>
      <h1>Vital Photography — Admin</h1>
      <button type="button" @click="logout">Log out</button>
    </header>

    <section class="upload">
      <h2>Upload New Photo</h2>
      <form @submit.prevent="submitUpload">
        <input ref="fileInput" type="file" accept="image/*" required />
        <input v-model="uploadForm.title" type="text" placeholder="Title" required />
        <select v-model="uploadForm.category">
          <option v-for="(label, slug) in CATEGORIES" :key="slug" :value="slug">{{ label }}</option>
        </select>
        <textarea v-model="uploadForm.description" placeholder="Description (optional)"></textarea>
        <input v-model="uploadForm.shootDate" type="date" />
        <button type="submit" :disabled="uploading">{{ uploading ? 'Uploading…' : 'Upload' }}</button>
        <p v-if="uploadError" class="error">{{ uploadError }}</p>
      </form>
    </section>

    <section class="photo-list">
      <h2>Photos ({{ photos.length }})</h2>
      <p v-if="photos.length === 0" class="empty">No photos yet.</p>

      <div v-for="(photo, index) in photos" :key="photo.id" class="photo-row">
        <img :src="photo.thumbnailUrl" :alt="photo.title" />

        <div v-if="editingId !== photo.id" class="photo-info">
          <strong>{{ photo.title }}</strong>
          <span class="muted">{{ CATEGORIES[photo.category] }}</span>
          <span class="muted" v-if="!photo.visible">Hidden</span>
          <div class="actions">
            <button type="button" @click="move(index, -1)" :disabled="index === 0">↑</button>
            <button type="button" @click="move(index, 1)" :disabled="index === photos.length - 1">↓</button>
            <button type="button" @click="startEdit(photo)">Edit</button>
            <button type="button" class="danger" @click="remove(photo.id, photo.title)">Delete</button>
          </div>
        </div>

        <form v-else class="edit-form" @submit.prevent="saveEdit(photo.id)">
          <input v-model="editForm.title" type="text" required />
          <select v-model="editForm.category">
            <option v-for="(label, slug) in CATEGORIES" :key="slug" :value="slug">{{ label }}</option>
          </select>
          <textarea v-model="editForm.description"></textarea>
          <input v-model="editForm.shootDate" type="date" />
          <label class="checkbox">
            <input v-model="editForm.visible" type="checkbox" /> Visible
          </label>
          <div class="actions">
            <button type="submit">Save</button>
            <button type="button" @click="cancelEdit">Cancel</button>
          </div>
          <p v-if="editError" class="error">{{ editError }}</p>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.25rem;
  margin: 0;
}

h2 {
  font-size: 1rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

section {
  margin-bottom: 2.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input,
select,
textarea,
button {
  font-size: 0.95rem;
  font-family: inherit;
}

input,
select,
textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
}

textarea {
  min-height: 4rem;
  resize: vertical;
}

button {
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background: var(--color-accent-dim);
  color: var(--color-text);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.danger {
  background: transparent;
  border: 1px solid #7a3b3b;
  color: #d97373;
}

.photo-row {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.photo-row img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.photo-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.muted {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.actions button {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.edit-form {
  flex: 1;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.checkbox input {
  width: auto;
}

.error {
  color: #d97373;
  font-size: 0.85rem;
  margin: 0;
}

.empty {
  color: var(--color-muted);
}
</style>
