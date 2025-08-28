<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
    <div class="w-full max-w-7xl">
      <h1 class="text-3xl font-bold mt-8 text-center">Contenu de la Box</h1>
      <p class="text-gray-400 mt-2 text-center font-mono">{{ boxId }}</p>
      
      <div class="mt-8">
        <div v-if="pending" class="text-center">Chargement...</div>
        <div v-else-if="error" class="text-center text-red-500">Erreur: Impossible de charger cette box.</div>
        
        <div v-else-if="data && data.files.length > 0">
          <!-- Controls -->
          <div class="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-4">
            <div class="font-bold">{{ data.files.length }} fichier(s)</div>
            <div class="flex-grow"></div>
            <!-- Filters -->
            <div v-if="availableFilters.length > 1" class="flex items-center gap-2">
              <span>Filtres:</span>
              <button @click="activeFilter = 'all'" :class="{'bg-green-600': activeFilter === 'all'}" class="px-3 py-1 rounded-md text-sm bg-gray-700 hover:bg-gray-600">Tous</button>
              <button
                v-for="filter in availableFilters"
                :key="filter.key"
                @click="activeFilter = filter.key"
                :class="{'bg-green-600': activeFilter === filter.key}"
                class="px-3 py-1 rounded-md text-sm bg-gray-700 hover:bg-gray-600"
              >
                {{ filter.label }}
              </button>
            </div>
            <div class="flex-grow"></div>
            <!-- Selection -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <input type="checkbox" v-model="isSelectedAll" @change="toggleSelectAll" class="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500"/>
                <label>Tout sélectionner</label>
              </div>
              <button 
                @click="downloadSelection"
                :disabled="selectedFiles.length === 0 || zipLoading"
                class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed w-40 text-center"
              >
                <span v-if="zipLoading">Création...</span>
                <span v-else>Télécharger ({{ selectedFiles.length }})</span>
              </button>
            </div>
          </div>

          <!-- Files Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="file in filteredFiles" :key="file" class="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col relative">
              <input type="checkbox" v-model="selectedFiles" :value="file.public_id" class="absolute top-2 left-2 h-5 w-5 rounded bg-gray-900 bg-opacity-50 border-gray-500 text-green-600 focus:ring-green-500"/>
              <div 
                class="h-32 bg-gray-700 flex items-center justify-center cursor-pointer"
                @click="openLightbox(file)"
                @mouseenter="videoRefs[file]?.play()"
                @mouseleave="videoRefs[file]?.pause()"
              >
                <img v-if="isImage(file)" :src="file.secure_url" class="h-full w-full object-cover" alt="thumbnail"/>
                <video v-else-if="isVideo(file)" :src="file.secure_url" class="h-full w-full object-cover" muted loop playsinline preload="metadata" :ref="el => { if (el) videoRefs[file] = el }"></video>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <div class="p-3 flex flex-col flex-grow">
                <p class="text-sm truncate flex-grow" :title="file.public_id">{{ file.public_id }}</p>
                <a :href="file.secure_url" download class="mt-2 bg-green-600 hover:bg-green-700 text-white text-center font-bold py-1 px-2 rounded text-xs transition-colors">Télécharger</a>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center text-gray-500">Cette box est vide.</div>
      </div>
    </div>
    <Lightbox v-if="lightboxContent" :url="lightboxContent.url" :type="lightboxContent.type" @close="closeLightbox" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const route = useRoute();
const boxId = route.params.id;

const { data, pending, error } = await useFetch(`/api/box/${boxId}`);

// --- State ---
const lightboxContent = ref(null);
const selectedFiles = ref([]);
const activeFilter = ref('all');
const zipLoading = ref(false);
const videoRefs = ref({}); // New ref to store video elements

// --- File Type Definitions ---
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

const getExtension = (url) => url.split('.').pop()?.toLowerCase() || '';
const isImage = (file) => IMAGE_EXTENSIONS.includes(getExtension(file.secure_url));
const isVideo = (file) => VIDEO_EXTENSIONS.includes(getExtension(file.secure_url));

// --- Computed Properties ---
// --- Computed Properties ---
const availableFilters = computed(() => {
  if (!data.value?.files) return [];
  const types = new Set();
  data.value.files.forEach(file => {
    if (isImage(file)) types.add('images');
    else if (isVideo(file)) types.add('videos');
    else types.add('other');
  });

  const filters = [];
  if (types.has('images')) filters.push({ key: 'images', label: 'Images' });
  if (types.has('videos')) filters.push({ key: 'videos', label: 'Vidéos' });
  if (types.has('other')) filters.push({ key: 'other', label: 'Autres' });

  return filters;
});

const filteredFiles = computed(() => {
  if (!data.value?.files) return [];
  switch (activeFilter.value) {
    case 'images':
      return data.value.files.filter(isImage);
    case 'videos':
      return data.value.files.filter(isVideo);
    case 'other':
      return data.value.files.filter(file => !isImage(file) && !isVideo(file));
    default:
      return data.value.files;
  }
});

const isSelectedAll = computed({
  get: () => filteredFiles.value.length > 0 && selectedFiles.value.length === filteredFiles.value.length && filteredFiles.value.every(file => selectedFiles.value.includes(file.public_id)),
  set: (value) => {
    selectedFiles.value = value ? filteredFiles.value.map(file => file.public_id) : [];
  }
});

// --- Methods ---
const openLightbox = (file) => {
  const fileType = isImage(file) ? 'image' : (isVideo(file) ? 'video' : 'other');
  if (fileType === 'image' || fileType === 'video') {
    lightboxContent.value = {
      url: file.secure_url,
      type: fileType,
    };
  }
};

const closeLightbox = () => {
  lightboxContent.value = null;
};

const toggleSelectAll = () => {
  isSelectedAll.value = !isSelectedAll.value;
};

const downloadSelection = async () => {
  if (selectedFiles.value.length === 0) return;
  zipLoading.value = true;
  try {
    const filesToDownload = selectedFiles.value.map(publicId => {
      return data.value.files.find(file => file.public_id === publicId);
    }).filter(Boolean); // Filter out any undefined if a publicId isn't found

    const publicIdsToDownload = filesToDownload.map(file => ({ public_id: file.public_id, secure_url: file.secure_url }));

    const response = await fetch('/api/zip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        boxId: boxId,
        files: publicIdsToDownload,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to download zip file.');
    }

    const responseData = await response.json();
    if (responseData.success && responseData.zipUrl) {
      const a = document.createElement('a');
      a.href = responseData.zipUrl;
      a.download = `${boxId}-archive.zip`; // Suggest a filename
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      throw new Error('Failed to get zip URL from server.');
    }

  } catch (err) {
    console.error('Download error:', err);
    // Optionally, show an error message to the user
  } finally {
    zipLoading.value = false;
  }
};

</script>
