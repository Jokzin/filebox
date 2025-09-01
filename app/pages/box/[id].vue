<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
    <div class="w-full max-w-7xl">
      <div class="flex justify-center items-center gap-4 mt-8">
        <h1 class="text-3xl font-bold text-center">Contenu de la Box</h1>
        <button @click="copyBoxUrlToClipboard" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
          {{ copyButtonText }}
        </button>
      </div>
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
            <!-- Download Button (Temporarily Hidden) -->
            <button
              @click="downloadAllAsZip"
              :disabled="zipLoading"
              class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed w-48 text-center"
            >
              <span v-if="zipLoading">Création de l'archive...</span>
              <span v-else>Tout télécharger (.zip)</span>
            </button>
          </div>

          <!-- Files Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="file in filteredFiles" :key="file.public_id" class="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
              <div
                class="h-32 bg-gray-700 flex items-center justify-center relative group"
                @mouseenter="videoRefs[file]?.play()"
                @mouseleave="videoRefs[file]?.pause()"
              >
                <img v-if="isImage(file)" :src="file.secure_url" class="h-full w-full object-cover" alt="thumbnail"/>
                <video v-else-if="isVideo(file)" :src="file.secure_url" class="h-full w-full object-cover" muted loop playsinline preload="metadata" :ref="el => { if (el) videoRefs[file] = el }"></video>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <div @click="openLightbox(file)" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <p class="text-white text-center p-2">Voir</p>
                </div>
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
const activeFilter = ref('all');
const zipLoading = ref(false);
const videoRefs = ref({});
const copyButtonText = ref('Copier le lien');

// --- File Type Definitions ---
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

const getExtension = (url) => url.split('.').pop()?.toLowerCase() || '';
const isImage = (file) => IMAGE_EXTENSIONS.includes(getExtension(file.secure_url));
const isVideo = (file) => VIDEO_EXTENSIONS.includes(getExtension(file.secure_url));

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

const copyBoxUrlToClipboard = () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    copyButtonText.value = 'Copié !';
    setTimeout(() => {
      copyButtonText.value = 'Copier le lien';
    }, 2000);
  }).catch(err => {
    copyButtonText.value = 'Erreur';
     setTimeout(() => {
      copyButtonText.value = 'Copier le lien';
    }, 2000);
  });
};

const downloadAllAsZip = async () => {
  zipLoading.value = true;
  try {
    const response = await fetch('/api/zip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boxId: boxId }),
    });

    if (!response.ok) {
      throw new Error("La génération de l'archive a échoué.");
    }

    // Handle the file stream response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boxId}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Download error:', err);
  } finally {
    zipLoading.value = false;
  }
};

</script>
