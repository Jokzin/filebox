<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <h1 class="text-4xl font-bold text-center mb-8">Bernie la boîte</h1>

      <!-- Dropzone -->
      <div
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'border-green-500 bg-gray-700': isDragging }"
        class="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-gray-700 transition-colors"
      >
        <p class="text-lg">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
        <input ref="fileInput" type="file" multiple @change="handleFileSelect" class="hidden" :disabled="isUploading" />
        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
      </div>

      <!-- File List -->
      <div v-if="files.length > 0" class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Fichiers sélectionnés :</h2>
        <ul>
          <li
            v-for="fileWrapper in files"
            :key="fileWrapper.id"
            class="flex justify-between items-center bg-gray-800 p-2 rounded-md mb-2"
          >
            <span class="truncate pr-4">{{ fileWrapper.file.name }}</span>
            <button @click="removeFile(fileWrapper.id)" class="ml-4 text-red-500 hover:text-red-400 disabled:opacity-50" :disabled="isUploading">
              &times;
            </button>
          </li>
        </ul>
      </div>

      <!-- Upload Button -->
      <div class="mt-6 text-center">
        <button
          @click="createBox"
          :disabled="files.length === 0 || isUploading"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed w-64"
        >
          <span v-if="isUploading">Envoi en cours... {{ uploadProgress }}%</span>
          <span v-else>Créer la Box</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { navigateTo } from '#app';
import { nanoid } from 'nanoid';

const files = ref([]);
const fileInput = ref(null);
const error = ref('');
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);

const triggerFileInput = () => {
  if (isUploading.value) return;
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  addFiles(event.target.files);
};

const handleDrop = (event) => {
  isDragging.value = false;
  addFiles(event.dataTransfer.files);
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const addFiles = (fileList) => {
  error.value = '';
  for (const file of fileList) {
    files.value.push({
      id: nanoid(),
      file: file,
    });
  }
};

const removeFile = (id) => {
  const index = files.value.findIndex(f => f.id === id);
  if (index > -1) {
    files.value.splice(index, 1);
  }
};

const createBox = async () => {
  if (files.value.length === 0) {
    error.value = 'Veuillez sélectionner au moins un fichier.';
    return;
  }
  error.value = '';
  isUploading.value = true;
  uploadProgress.value = 0;

  const boxId = nanoid(10);
  const formData = new FormData();
  formData.append('boxId', boxId);
  files.value.forEach(fileWrapper => {
    formData.append('files', fileWrapper.file, fileWrapper.file.name);
  });

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      uploadProgress.value = Math.round((event.loaded / event.total) * 100);
    }
  };

  xhr.onload = async () => {
    isUploading.value = false;
    if (xhr.status >= 200 && xhr.status < 300) {
      const data = JSON.parse(xhr.responseText);
      if (data.success && data.boxId) {
        await navigateTo(`/box/${data.boxId}`);
      } else {
        error.value = "L'upload a réussi mais la réponse du serveur est invalide.";
      }
    } else {
      try {
        const data = JSON.parse(xhr.responseText);
        error.value = data.statusMessage || `Échec de l'upload: ${xhr.statusText}`;
      } catch (e) {
        error.value = `Échec de l'upload: ${xhr.statusText}`;
      }
    }
  };

  xhr.onerror = () => {
    isUploading.value = false;
    error.value = "Erreur réseau lors de l'upload.";
  };

  xhr.send(formData);
};
</script>
